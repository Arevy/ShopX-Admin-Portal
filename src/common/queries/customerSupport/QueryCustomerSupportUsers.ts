import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type { CustomerSupportUsersResponse, CustomerSupportUsersVariables } from '@/types/graphql'

export const QueryCustomerSupportUsers = new QueryFactory<
  CustomerSupportUsersResponse,
  CustomerSupportUsersVariables
>({
  queryName: 'CustomerSupportUsers',
  operationType: 'query',
  cacheOptions: { cacheable: false },
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
