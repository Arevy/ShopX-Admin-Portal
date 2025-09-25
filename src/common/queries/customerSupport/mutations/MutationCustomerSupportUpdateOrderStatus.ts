import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportUpdateOrderStatusResponse,
  CustomerSupportUpdateOrderStatusVariables,
} from '@/types/graphql'

export const MutationCustomerSupportUpdateOrderStatus = new QueryFactory<
  CustomerSupportUpdateOrderStatusResponse,
  CustomerSupportUpdateOrderStatusVariables
>({
  queryName: 'CustomerSupportUpdateOrderStatus',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportUpdateOrderStatus($orderId: ID!, $status: String!) {
      customerSupport {
        updateOrderStatus(orderId: $orderId, status: $status)
      }
    }
  `),
})
