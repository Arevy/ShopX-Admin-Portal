import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportImpersonateUserResponse,
  CustomerSupportImpersonateUserVariables,
} from '@/types/graphql'

export const MutationCustomerSupportImpersonateUser = new QueryFactory<
  CustomerSupportImpersonateUserResponse,
  CustomerSupportImpersonateUserVariables
>({
  queryName: 'CustomerSupportImpersonateUser',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportImpersonateUser($userId: ID!) {
      customerSupport {
        impersonateUser(userId: $userId) {
          token
          expiresAt
        }
      }
    }
  `),
})
