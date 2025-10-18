import { parse } from 'graphql'

import { QueryFactory } from '@/graphql/utils/QueryFactory'
import {
  normalizeOrderVariables,
  normalizeOrdersDataset,
} from '@/graphql/customerSupport/normalizers'
import type { CustomerSupportOrdersResponse, CustomerSupportOrdersVariables } from '@/types/graphql'

export const QueryCustomerSupportOrders = new QueryFactory<
  CustomerSupportOrdersResponse,
  CustomerSupportOrdersVariables
>({
  queryName: 'CustomerSupportOrders',
  operationType: 'query',
  cacheOptions: { cacheable: false },
  preProcess: async (_, variables) => {
    const { sanitized, errorMessage } = normalizeOrderVariables(variables)
    if (errorMessage) {
      throw new Error(errorMessage)
    }
    return sanitized
  },
  postProcess: async (_, response, variables) => {
    const sanitizedVariables = normalizeOrderVariables(variables).sanitized

    const connection = response.data?.customerSupport?.ordersConnection
    const normalizedOrders = normalizeOrdersDataset(connection?.items, sanitizedVariables)

    if (!response.data?.customerSupport) {
      return {
        ...response,
        data: {
          customerSupport: {
            orders: normalizedOrders,
            ordersTotalCount: connection?.totalCount ?? normalizedOrders.length,
          },
        },
      }
    }

    return {
      ...response,
      data: {
        customerSupport: {
          ...response.data.customerSupport,
          orders: normalizedOrders,
          ordersTotalCount: connection?.totalCount ?? normalizedOrders.length,
        },
      },
    }
  },
  queryObject: parse(/* GraphQL */ `
    query CustomerSupportOrders($userId: ID, $status: String, $limit: Int, $offset: Int) {
      customerSupport {
        ordersConnection(userId: $userId, status: $status, limit: $limit, offset: $offset) {
          items {
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
          totalCount
        }
      }
    }
  `),
})
