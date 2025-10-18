import { parse } from 'graphql'

import { QueryFactory } from '@/graphql/utils/QueryFactory'
import type {
  CustomerSupportDeleteUserResponse,
  CustomerSupportDeleteUserVariables,
} from '@/types/graphql'

export const MutationCustomerSupportDeleteUser = new QueryFactory<
  CustomerSupportDeleteUserResponse,
  CustomerSupportDeleteUserVariables
>({
  queryName: 'CustomerSupportDeleteUser',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportDeleteUser($id: ID!) {
      customerSupport {
        deleteUser(id: $id)
      }
    }
  `),
})
