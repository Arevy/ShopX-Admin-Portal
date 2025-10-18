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

    const normalizedOrders = normalizeOrdersDataset(
      response.data?.customerSupport.orders,
      sanitizedVariables,
    )

    if (!response.data?.customerSupport) {
      return {
        ...response,
        data: {
          customerSupport: {
            orders: normalizedOrders,
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
        },
      },
    }
  },
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
