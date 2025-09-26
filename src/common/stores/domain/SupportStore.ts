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

      const support = response.data?.customerSupport

      runInAction(() => {
        if (!support || !support.userContext) {
          this.customerProfile = null
          return
        }

        const context = support.userContext
        const user = context.user
          ? {
              id: String(context.user.id),
              email: context.user.email,
              name: context.user.name ?? null,
              role: context.user.role,
            }
          : null

        const addresses = (context.addresses ?? []).map((address) => ({
          id: String(address.id),
          userId: String(address.userId ?? user?.id ?? ''),
          street: address.street,
          city: address.city,
          postalCode: address.postalCode,
          country: address.country,
        }))

        const cart = context.cart
          ? {
              userId: String(context.cart.userId),
              total: Number(context.cart.total ?? 0),
              items: context.cart.items.map((item) => ({
                quantity: Number(item.quantity ?? 0),
                product: {
                  id: String(item.product.id),
                  name: item.product.name,
                  price: Number(item.product.price ?? 0),
                  description: null,
                  categoryId: null,
                },
              })),
            }
          : null

        const wishlist = context.wishlist
          ? {
              userId: String(context.wishlist.userId),
              products: context.wishlist.products.map((product) => ({
                id: String(product.id),
                name: product.name,
                price: Number(product.price ?? 0),
                description: null,
                categoryId: null,
              })),
            }
          : null

        const orders = (support.orders ?? []).map((order) => ({
          id: String(order.id),
          userId: user?.id ?? '',
          total: Number(order.total ?? 0),
          status: String(order.status),
          createdAt: order.createdAt ?? null,
          updatedAt: null,
          products: [],
        }))

        const reviews = (support.reviews ?? []).map((review) => ({
          id: String(review.id),
          productId: String(review.productId),
          rating: Number(review.rating ?? 0),
          reviewText: review.reviewText ?? null,
          createdAt: review.createdAt,
        }))

        this.customerProfile = {
          user,
          orders,
          addresses,
          cart,
          wishlist,
          reviews,
        }
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
