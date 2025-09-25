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
        user(id: $userId) {
          id
          email
          name
          role
        }
        orders(userId: $userId, limit: 10, offset: 0) {
          id
          total
          status
          createdAt
        }
        addresses(userId: $userId) {
          id
          street
          city
          postalCode
          country
        }
        cart(userId: $userId) {
          userId
          total
          items {
            quantity
            product {
              id
              name
              price
            }
          }
        }
        wishlist(userId: $userId) {
          products {
            id
            name
          }
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
