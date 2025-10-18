import { parse } from 'graphql'

import { QueryFactory } from '@/graphql/utils/QueryFactory'
import {
  normalizeUserVariables,
  normalizeUsersDataset,
} from '@/graphql/customerSupport/normalizers'
import type { CustomerSupportUsersResponse, CustomerSupportUsersVariables } from '@/types/graphql'

export const QueryCustomerSupportUsers = new QueryFactory<
  CustomerSupportUsersResponse,
  CustomerSupportUsersVariables
>({
  queryName: 'CustomerSupportUsers',
  operationType: 'query',
  cacheOptions: { cacheable: false },
  preProcess: async (_, variables) => normalizeUserVariables(variables),
  postProcess: async (_, response) => {
    const normalizedUsers = normalizeUsersDataset(response.data?.customerSupport.users)

    if (!response.data?.customerSupport) {
      return {
        ...response,
        data: {
          customerSupport: {
            users: normalizedUsers,
          },
        },
      }
    }

    return {
      ...response,
      data: {
        customerSupport: {
          ...response.data.customerSupport,
          users: normalizedUsers,
        },
      },
    }
  },
  queryObject: parse(/* GraphQL */ `
    query CustomerSupportUsers($email: String, $role: UserRole) {
      customerSupport {
        users(email: $email, role: $role) {
          id
          email
          name
          role
        }
      }
    }
  `),
})
