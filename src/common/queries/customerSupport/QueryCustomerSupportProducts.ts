import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type { CustomerSupportProductsResponse, CustomerSupportProductsVariables } from '@/types/graphql'

export const QueryCustomerSupportProducts = new QueryFactory<
  CustomerSupportProductsResponse,
  CustomerSupportProductsVariables
>({
  queryName: 'CustomerSupportProducts',
  operationType: 'query',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    query CustomerSupportProducts($limit: Int, $offset: Int, $name: String, $categoryId: ID) {
      customerSupport {
        products(limit: $limit, offset: $offset, name: $name, categoryId: $categoryId) {
          id
          name
          price
          description
          categoryId
          category {
            id
            name
          }
          image {
            url
            filename
            mimeType
            updatedAt
          }
        }
        categories(limit: 50) {
          id
          name
        }
      }
    }
  `),
})
