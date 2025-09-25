import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type { CustomerSupportOrdersResponse, CustomerSupportOrdersVariables } from '@/types/graphql'

export const QueryCustomerSupportOrders = new QueryFactory<
  CustomerSupportOrdersResponse,
  CustomerSupportOrdersVariables
>({
  queryName: 'CustomerSupportOrders',
  operationType: 'query',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    query CustomerSupportOrders($userId: ID, $status: String, $limit: Int, $offset: Int) {
      customerSupport {
        orders(userId: $userId, status: $status, limit: $limit, offset: $offset) {
          id
          userId
          total
          status
          createdAt
          updatedAt
          products {
            productId
            quantity
            price
          }
        }
      }
    }
  `),
})
