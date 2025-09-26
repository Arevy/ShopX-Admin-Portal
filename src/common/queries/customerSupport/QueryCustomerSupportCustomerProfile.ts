import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportCustomerProfileResponse,
  CustomerSupportCustomerProfileVariables,
} from '@/types/graphql'

export const QueryCustomerSupportCustomerProfile = new QueryFactory<
  CustomerSupportCustomerProfileResponse,
  CustomerSupportCustomerProfileVariables
>({
  queryName: 'CustomerSupportCustomerProfile',
  operationType: 'query',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    query CustomerSupportCustomerProfile($userId: ID!) {
      customerSupport {
        userContext(userId: $userId) {
          user {
            id
            email
            name
            role
          }
          cart {
            userId
            total
            items {
              quantity
              product {
                id
                name
                price
                image {
                  url
                  mimeType
                }
              }
            }
          }
          wishlist {
            userId
            products {
              id
              name
              price
              image {
                url
                mimeType
              }
            }
          }
          addresses {
            id
            userId
            street
            city
            postalCode
            country
          }
        }
        orders(userId: $userId, limit: 10, offset: 0) {
          id
          total
          status
          createdAt
        }
        reviews(userId: $userId) {
          id
          productId
          rating
          reviewText
          createdAt
        }
      }
    }
  `),
})
