import { makeAutoObservable, runInAction } from 'mobx'

import { MutationCustomerSupportCreateUser } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportCreateUser'
import { MutationCustomerSupportDeleteUser } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportDeleteUser'
import { MutationCustomerSupportUpdateUser } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportUpdateUser'
import { MutationCustomerSupportLogoutUserSessions } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportLogoutUserSessions'
import { MutationCustomerSupportImpersonateUser } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportImpersonateUser'
import { QueryCustomerSupportUsers } from '@/common/queries/customerSupport/QueryCustomerSupportUsers'
import type RootContext from '@/common/stores/RootContext'
import { User, UserRole } from '@/types/domain'
import type {
  CustomerSupportCreateUserVariables,
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

export class UserStore {
  private readonly root: RootContext
  users: User[] = []
  loading = false
  error: string | null = null
  filters: UserFilters = {}

  constructor(root: RootContext) {
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
        this.error =
          error instanceof Error ? error.message : 'Unexpected error fetching users.'
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
}
