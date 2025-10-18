import { parse } from 'graphql'

import { QueryFactory } from '@/graphql/utils/QueryFactory'
import type {
  AdminPortalLoginResponse,
  AdminPortalLoginVariables,
} from '@/types/graphql'

export const MutationAdminPortalLogin = new QueryFactory<
  AdminPortalLoginResponse,
  AdminPortalLoginVariables
>({
  queryName: 'AdminPortalLogin',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation AdminPortalLogin($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        token
        user {
          id
          email
          name
          role
        }
      }
    }
  `),
})

