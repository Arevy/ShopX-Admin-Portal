import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportUpdateUserResponse,
  CustomerSupportUpdateUserVariables,
} from '@/types/graphql'

export const MutationCustomerSupportUpdateUser = new QueryFactory<
  CustomerSupportUpdateUserResponse,
  CustomerSupportUpdateUserVariables
>({
  queryName: 'CustomerSupportUpdateUser',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportUpdateUser(
      $id: ID!
      $email: String
      $name: String
      $role: UserRole
      $password: String
    ) {
      customerSupport {
        updateUser(
          id: $id
          email: $email
          name: $name
          role: $role
          password: $password
        ) {
          id
          email
          name
          role
        }
      }
    }
  `),
})
