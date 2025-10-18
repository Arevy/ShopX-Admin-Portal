import { parse } from 'graphql'

import { QueryFactory } from '@/graphql/utils/QueryFactory'
import type {
  AdminUpdateProfileResponse,
  AdminUpdateProfileVariables,
} from '@/types/graphql'

export const MutationUpdateUserProfile = new QueryFactory<
  AdminUpdateProfileResponse,
  AdminUpdateProfileVariables
>({
  queryName: 'AdminUpdateUserProfile',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation AdminUpdateUserProfile($input: UpdateUserProfileInput!) {
      updateUserProfile(input: $input) {
        user {
          id
          email
          name
          role
        }
        message
      }
    }
  `),
})

export default MutationUpdateUserProfile
