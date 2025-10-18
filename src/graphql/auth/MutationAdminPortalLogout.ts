import { parse } from 'graphql'

import { QueryFactory } from '@/graphql/utils/QueryFactory'
import type {
  AdminPortalLogoutResponse,
  AdminPortalLogoutVariables,
} from '@/types/graphql'

export const MutationAdminPortalLogout = new QueryFactory<
  AdminPortalLogoutResponse,
  AdminPortalLogoutVariables
>({
  queryName: 'AdminPortalLogout',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation AdminPortalLogout {
      logout
    }
  `),
})

