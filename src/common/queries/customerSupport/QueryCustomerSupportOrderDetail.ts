import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportOrderDetailResponse,
  CustomerSupportOrderDetailVariables,
} from '@/types/graphql'

export const QueryCustomerSupportOrderDetail = new QueryFactory<
  CustomerSupportOrderDetailResponse,
  CustomerSupportOrderDetailVariables
>({
  queryName: 'CustomerSupportOrderDetail',
  operationType: 'query',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    query CustomerSupportOrderDetail($orderId: ID!) {
      customerSupport {
        order(id: $orderId) {
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
