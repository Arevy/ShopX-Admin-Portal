import { makeAutoObservable, runInAction } from 'mobx'

import { MutationCustomerSupportCreateUser } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportCreateUser'
import { MutationCustomerSupportDeleteUser } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportDeleteUser'
import { MutationCustomerSupportUpdateUser } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportUpdateUser'
import { QueryCustomerSupportUsers } from '@/common/queries/customerSupport/QueryCustomerSupportUsers'
import type RootContext from '@/common/stores/RootContext'
import { User, UserRole } from '@/types/domain'
import type {
  CustomerSupportCreateUserVariables,
  CustomerSupportUpdateUserVariables,
  CustomerSupportUsersVariables,
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

      runInAction(() => {
        this.users = response.data?.customerSupport.users ?? []
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
}
