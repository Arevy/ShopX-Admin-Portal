import { makeAutoObservable, runInAction } from 'mobx'

import {
  MutationCustomerSupportCreateUser,
  MutationCustomerSupportDeleteUser,
  MutationCustomerSupportUpdateUser,
  MutationCustomerSupportLogoutUserSessions,
  MutationCustomerSupportImpersonateUser,
  MutationCustomerSupportUpdateOrderStatus,
  QueryCustomerSupportOrderDetail,
  QueryCustomerSupportOrders,
  QueryCustomerSupportUsers,
} from '@/graphql/customerSupport'
import { MutationAdminPortalLogin, MutationAdminPortalLogout } from '@/graphql/auth'
import type { RootStore } from '@/stores/rootStore'
import { getUserFriendlyMessage } from '@/lib/getUserFriendlyMessage'
import { Order, User, UserRole } from '@/types/domain'
import type {
  AdminPortalLoginVariables,
  CustomerSupportCreateUserVariables,
  CustomerSupportOrderDetailVariables,
  CustomerSupportOrdersVariables,
  CustomerSupportUpdateOrderStatusVariables,
  CustomerSupportUpdateUserVariables,
  CustomerSupportUsersVariables,
  CustomerSupportLogoutUserSessionsResponse,
  CustomerSupportLogoutUserSessionsVariables,
  CustomerSupportImpersonateUserResponse,
  CustomerSupportImpersonateUserVariables,
} from '@/types/graphql'

interface UserFilters {
  email?: string
  role?: UserRole
}

interface CreateUserInput {
  email: string
  password: string
  name?: string
  role: UserRole
}

interface UpdateUserInput {
  email?: string
  password?: string
  name?: string
  role?: UserRole
}

interface OrderFilters {
  userId?: string
  status?: string
  limit?: number
  offset?: number
}

export class UserStore {
  private readonly root: RootStore
  users: User[] = []
  loading = false
  error: string | null = null
  filters: UserFilters = {}
  sessionUser: User | null = null
  authLoading = false
  authError: string | null = null
  lastLoginAt: number | null = null
  orders: Order[] = []
  selectedOrder: Order | null = null
  ordersLoading = false
  ordersError: string | null = null
  orderFilters: OrderFilters = { limit: 20, offset: 0 }

  constructor(root: RootStore) {
    this.root = root
    makeAutoObservable(this, {}, { autoBind: true })
  }

  async fetchUsers(filters?: UserFilters) {
    this.loading = true
    this.error = null

    const merged: UserFilters = {
      ...this.filters,
      ...filters,
    }

    const sanitized: CustomerSupportUsersVariables = {
      email: merged.email?.trim() || undefined,
      role: merged.role,
    }

    this.filters = sanitized

    try {
      const response = await this.root.apiService.executeGraphQL(
        QueryCustomerSupportUsers,
        sanitized,
      )

      if (response.errors?.length) {
        throw new Error(response.errors.map((err) => err.message).join('; '))
      }

      const dataset = response.data?.customerSupport.users ?? []
      const normalizedEmail = sanitized.email?.toLowerCase() ?? null
      const normalizedRole = sanitized.role ?? null

      const filteredUsers = dataset.filter((user) => {
        if (normalizedEmail && !user.email.toLowerCase().includes(normalizedEmail)) {
          return false
        }

        if (normalizedRole && user.role !== normalizedRole) {
          return false
        }

        return true
      })

      runInAction(() => {
        this.users = filteredUsers
      })
    } catch (error) {
      runInAction(() => {
        this.error = getUserFriendlyMessage(
          error,
          'Unexpected error fetching users.',
        )
        this.users = []
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  async createUser(input: CreateUserInput) {
    const variables: CustomerSupportCreateUserVariables = {
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role,
    }

    const response = await this.root.apiService.executeGraphQL(
      MutationCustomerSupportCreateUser,
      variables,
    )

    if (response.errors?.length) {
      throw new Error(response.errors.map((err) => err.message).join('; '))
    }

    await this.fetchUsers(this.filters)
  }

  async updateUser(id: string, input: UpdateUserInput) {
    const variables: CustomerSupportUpdateUserVariables = {
      id,
      email: input.email,
      name: input.name,
      role: input.role,
      password: input.password,
    }

    const response = await this.root.apiService.executeGraphQL(
      MutationCustomerSupportUpdateUser,
      variables,
    )

    if (response.errors?.length) {
      throw new Error(response.errors.map((err) => err.message).join('; '))
    }

    await this.fetchUsers(this.filters)
  }

  async deleteUser(id: string) {
    const response = await this.root.apiService.executeGraphQL(
      MutationCustomerSupportDeleteUser,
      { id },
    )

    if (response.errors?.length) {
      throw new Error(response.errors.map((err) => err.message).join('; '))
    }

    await this.fetchUsers(this.filters)
  }

  async logoutUserSessions(userId: string): Promise<boolean> {
    const response = await this.root.apiService.executeGraphQL<
      CustomerSupportLogoutUserSessionsResponse,
      CustomerSupportLogoutUserSessionsVariables
    >(MutationCustomerSupportLogoutUserSessions, { userId })

    if (response.errors?.length) {
      throw new Error(response.errors.map((err) => err.message).join('; '))
    }

    await this.fetchUsers(this.filters)
    return Boolean(response.data?.customerSupport.logoutUserSessions)
  }

  async impersonateUser(userId: string) {
    const response = await this.root.apiService.executeGraphQL<
      CustomerSupportImpersonateUserResponse,
      CustomerSupportImpersonateUserVariables
    >(MutationCustomerSupportImpersonateUser, { userId })

    if (response.errors?.length) {
      throw new Error(response.errors.map((err) => err.message).join('; '))
    }

    return response.data?.customerSupport.impersonateUser ?? null
  }

  clearAuthError() {
    this.authError = null
  }

  setSessionUser(user: User | null) {
    this.sessionUser = user
  }

  async login(email: string, password: string) {
    this.authLoading = true
    this.authError = null

    const variables: AdminPortalLoginVariables = {
      email: email.trim(),
      password,
    }

    try {
      const response = await this.root.apiService.executeGraphQL(
        MutationAdminPortalLogin,
        variables,
      )

      const session = response.data?.login
      if (!session?.user) {
        throw new Error('Login failed.')
      }

      const authenticatedUser: User = {
        id: String(session.user.id),
        email: session.user.email,
        name: session.user.name ?? null,
        role: session.user.role,
      }

      runInAction(() => {
        this.sessionUser = authenticatedUser
        this.lastLoginAt = Date.now()
      })

      this.root.setAuthToken(session.token)

      return authenticatedUser
    } catch (error) {
      const message = getUserFriendlyMessage(error, 'Unexpected error signing in.', {
        knownMessages: [
          { match: /invalid email/i, value: 'Invalid email or password.' },
          { match: /support authentication required/i, value: 'Invalid email or password.' },
        ],
      })
      runInAction(() => {
        this.authError = message
        this.sessionUser = null
      })
      throw new Error(message)
    } finally {
      runInAction(() => {
        this.authLoading = false
      })
    }
  }

  async logout() {
    try {
      await this.root.apiService.executeGraphQL(MutationAdminPortalLogout)
      runInAction(() => {
        this.sessionUser = null
        this.lastLoginAt = null
        this.orders = []
        this.selectedOrder = null
        this.orderFilters = { limit: 20, offset: 0 }
        this.ordersError = null
        this.ordersLoading = false
        this.resetAddresses()
      })
      this.root.setAuthToken(undefined)
    } catch (error) {
      const message = getUserFriendlyMessage(error, 'Failed to sign out.')
      throw new Error(message)
    }
  }

  async fetchOrders(filters?: OrderFilters) {
    this.ordersLoading = true
    this.ordersError = null

    const merged: OrderFilters = {
      ...this.orderFilters,
      ...filters,
    }

    const sanitizedUserId = merged.userId?.trim()
    const normalizedUserId = sanitizedUserId && /^[0-9]+$/.test(sanitizedUserId)
      ? sanitizedUserId
      : undefined

    const normalizedStatus = merged.status?.trim()
    const sanitizedStatus = normalizedStatus ? normalizedStatus.toUpperCase() : undefined

    const sanitized: CustomerSupportOrdersVariables = {
      limit: typeof merged.limit === 'number' ? merged.limit : 20,
      offset: typeof merged.offset === 'number' ? merged.offset : 0,
      status: sanitizedStatus,
      userId: normalizedUserId,
    }

    this.orderFilters = {
      limit: sanitized.limit,
      offset: sanitized.offset,
      status: sanitized.status,
      userId: merged.userId,
    }

    if (merged.userId && !normalizedUserId) {
      runInAction(() => {
        this.orders = []
        this.ordersLoading = false
        this.ordersError = 'User ID filters accept only numeric identifiers.'
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

      const dataset = response.data?.customerSupport.orders ?? []
      const normalizedStatusFilter = sanitized.status ?? null
      const normalizedUserIdFilter = sanitized.userId ?? null

      const filteredOrders = dataset.filter((order) => {
        if (
          normalizedStatusFilter &&
          String(order.status).toUpperCase() !== normalizedStatusFilter
        ) {
          return false
        }

        if (
          normalizedUserIdFilter &&
          String(order.userId ?? '') !== normalizedUserIdFilter
        ) {
          return false
        }

        return true
      })

      runInAction(() => {
        this.orders = filteredOrders
        this.ordersError = null
      })
    } catch (error) {
      runInAction(() => {
        this.ordersError = getUserFriendlyMessage(
          error,
          'Unexpected error fetching orders.',
        )
        this.orders = []
      })
    } finally {
      runInAction(() => {
        this.ordersLoading = false
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

    await this.fetchOrders(this.orderFilters)
    if (this.selectedOrder?.id === orderId) {
      await this.loadOrder(orderId)
    }
  }
}
