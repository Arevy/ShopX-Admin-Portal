import { parse } from 'graphql'

import { QueryFactory } from '@/graphql/utils/QueryFactory'
import type {
  AdminChangePasswordResponse,
  AdminChangePasswordVariables,
} from '@/types/graphql'

export const MutationChangeUserPassword = new QueryFactory<
  AdminChangePasswordResponse,
  AdminChangePasswordVariables
>({
  queryName: 'AdminChangeUserPassword',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation AdminChangeUserPassword($currentPassword: String!, $newPassword: String!) {
      changeUserPassword(currentPassword: $currentPassword, newPassword: $newPassword)
    }
  `),
})

export default MutationChangeUserPassword
