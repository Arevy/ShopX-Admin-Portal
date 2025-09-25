import { makeAutoObservable, runInAction } from 'mobx'

import { MutationCustomerSupportUpdateOrderStatus } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportUpdateOrderStatus'
import { QueryCustomerSupportOrderDetail } from '@/common/queries/customerSupport/QueryCustomerSupportOrderDetail'
import { QueryCustomerSupportOrders } from '@/common/queries/customerSupport/QueryCustomerSupportOrders'
import type RootContext from '@/common/stores/RootContext'
import { Order } from '@/types/domain'
import type {
  CustomerSupportOrderDetailVariables,
  CustomerSupportOrdersVariables,
  CustomerSupportUpdateOrderStatusVariables,
} from '@/types/graphql'

interface OrderFilters {
  userId?: string
  status?: string
  limit?: number
  offset?: number
}

export class OrderStore {
  private readonly root: RootContext
  orders: Order[] = []
  selectedOrder: Order | null = null
  loading = false
  error: string | null = null
  filters: OrderFilters = { limit: 20, offset: 0 }

  constructor(root: RootContext) {
    this.root = root
    makeAutoObservable(this, {}, { autoBind: true })
  }

  async fetchOrders(filters?: OrderFilters) {
    this.loading = true
    this.error = null

    const merged: OrderFilters = {
      ...this.filters,
      ...filters,
    }

    const sanitizedUserId = merged.userId?.trim()
    const normalizedUserId = sanitizedUserId && /^[0-9]+$/.test(sanitizedUserId)
      ? sanitizedUserId
      : undefined

    const sanitized: CustomerSupportOrdersVariables = {
      limit: typeof merged.limit === 'number' ? merged.limit : 20,
      offset: typeof merged.offset === 'number' ? merged.offset : 0,
      status: merged.status?.trim() || undefined,
      userId: normalizedUserId,
    }

    this.filters = {
      limit: sanitized.limit,
      offset: sanitized.offset,
      status: sanitized.status,
      userId: merged.userId,
    }

    if (merged.userId && !normalizedUserId) {
      runInAction(() => {
        this.orders = []
        this.loading = false
        this.error = 'User ID filters accept only numeric identifiers.'
      })
      return
    }

    try {
      const response = await this.root.apiService.executeGraphQL(
        QueryCustomerSupportOrders,
        sanitized,
      )

      if (response.errors?.length) {
        throw new Error(response.errors.map((err) => err.message).join('; '))
      }

      runInAction(() => {
        this.orders = response.data?.customerSupport.orders ?? []
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : 'Unexpected error fetching orders.'
        this.orders = []
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  async loadOrder(orderId: string) {
    const variables: CustomerSupportOrderDetailVariables = { orderId }
    const response = await this.root.apiService.executeGraphQL(
      QueryCustomerSupportOrderDetail,
      variables,
    )

    if (response.errors?.length) {
      throw new Error(response.errors.map((err) => err.message).join('; '))
    }

    runInAction(() => {
      this.selectedOrder = response.data?.customerSupport.order ?? null
    })
  }

  async updateOrderStatus(orderId: string, status: string) {
    const variables: CustomerSupportUpdateOrderStatusVariables = {
      orderId,
      status,
    }

    const response = await this.root.apiService.executeGraphQL(
      MutationCustomerSupportUpdateOrderStatus,
      variables,
    )

    if (response.errors?.length) {
      throw new Error(response.errors.map((err) => err.message).join('; '))
    }

    await this.fetchOrders(this.filters)
    if (this.selectedOrder?.id === orderId) {
      await this.loadOrder(orderId)
    }
  }
}
