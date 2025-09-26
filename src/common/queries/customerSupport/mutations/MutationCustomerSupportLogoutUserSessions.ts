import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportLogoutUserSessionsResponse,
  CustomerSupportLogoutUserSessionsVariables,
} from '@/types/graphql'

export const MutationCustomerSupportLogoutUserSessions = new QueryFactory<
  CustomerSupportLogoutUserSessionsResponse,
  CustomerSupportLogoutUserSessionsVariables
>({
  queryName: 'CustomerSupportLogoutUserSessions',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportLogoutUserSessions($userId: ID!) {
      customerSupport {
        logoutUserSessions(userId: $userId)
      }
    }
  `),
})
