import { makeAutoObservable, runInAction } from 'mobx'

import { QueryCustomerSupportCustomerProfile } from '@/common/queries/customerSupport/QueryCustomerSupportCustomerProfile'
import { QueryCustomerSupportOverview } from '@/common/queries/customerSupport/QueryCustomerSupportOverview'
import type RootContext from '@/common/stores/RootContext'
import { CustomerProfile, SupportMetrics } from '@/types/domain'
import type {
  CustomerSupportCustomerProfileVariables,
  CustomerSupportOverviewVariables,
} from '@/types/graphql'

export class SupportStore {
  private readonly root: RootContext
  metrics: SupportMetrics | null = null
  overviewLoading = false
  overviewError: string | null = null

  customerProfile: CustomerProfile | null = null
  profileLoading = false
  profileError: string | null = null

  constructor(root: RootContext) {
    this.root = root
    makeAutoObservable(this, {}, { autoBind: true })
  }

  async loadOverview() {
    this.overviewLoading = true
    this.overviewError = null

    const variables: CustomerSupportOverviewVariables = {
      productLimit: 50,
      orderLimit: 50,
    }

    try {
      const response = await this.root.apiService.executeGraphQL(
        QueryCustomerSupportOverview,
        variables,
      )

      if (response.errors?.length) {
        throw new Error(response.errors.map((err) => err.message).join('; '))
      }

      const support = response.data?.customerSupport

      runInAction(() => {
        if (!support) {
          this.metrics = null
          return
        }

        const totalRevenue = support.orders.reduce((sum, order) => sum + order.total, 0)
        const averageRating = support.reviews.length
          ? support.reviews.reduce((sum, review) => sum + review.rating, 0) /
            support.reviews.length
          : null

        this.metrics = {
          totalRevenue,
          orders: support.orders.length,
          products: support.products.length,
          customers: support.users.filter((user) => user.role === 'CUSTOMER').length,
          averageRating,
        }
      })
    } catch (error) {
      runInAction(() => {
        this.overviewError =
          error instanceof Error ? error.message : 'Unexpected error fetching metrics.'
        this.metrics = null
      })
    } finally {
      runInAction(() => {
        this.overviewLoading = false
      })
    }
  }

  async loadCustomerProfile(userId: string) {
    this.profileLoading = true
    this.profileError = null

    const variables: CustomerSupportCustomerProfileVariables = { userId }

    try {
      const response = await this.root.apiService.executeGraphQL(
        QueryCustomerSupportCustomerProfile,
        variables,
      )

      if (response.errors?.length) {
        throw new Error(response.errors.map((err) => err.message).join('; '))
      }

      runInAction(() => {
        this.customerProfile = response.data?.customerSupport ?? null
      })
    } catch (error) {
      runInAction(() => {
        this.profileError =
          error instanceof Error
            ? error.message
            : 'Unexpected error loading customer profile.'
        this.customerProfile = null
      })
    } finally {
      runInAction(() => {
        this.profileLoading = false
      })
    }
  }

  resetCustomerProfile() {
    this.customerProfile = null
    this.profileError = null
  }
}
