import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportCreateUserResponse,
  CustomerSupportCreateUserVariables,
} from '@/types/graphql'

export const MutationCustomerSupportCreateUser = new QueryFactory<
  CustomerSupportCreateUserResponse,
  CustomerSupportCreateUserVariables
>({
  queryName: 'CustomerSupportCreateUser',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportCreateUser(
      $email: String!
      $password: String!
      $name: String
      $role: UserRole!
    ) {
      customerSupport {
        createUser(email: $email, password: $password, name: $name, role: $role) {
          id
          email
          name
          role
        }
      }
    }
  `),
})
