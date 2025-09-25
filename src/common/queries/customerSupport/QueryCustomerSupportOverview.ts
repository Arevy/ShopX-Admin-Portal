import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type { CustomerSupportOverviewResponse, CustomerSupportOverviewVariables } from '@/types/graphql'

export const QueryCustomerSupportOverview = new QueryFactory<
  CustomerSupportOverviewResponse,
  CustomerSupportOverviewVariables
>({
  queryName: 'CustomerSupportOverview',
  operationType: 'query',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    query CustomerSupportOverview($productLimit: Int, $orderLimit: Int) {
      customerSupport {
        products(limit: $productLimit, offset: 0) {
          id
          name
          price
        }
        orders(limit: $orderLimit, offset: 0) {
          id
          userId
          total
          status
          createdAt
        }
        users {
          id
          role
        }
        reviews {
          id
          rating
        }
      }
    }
  `),
})
