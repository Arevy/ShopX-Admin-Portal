import { parse } from 'graphql'

import { QueryFactory } from '@/graphql/utils/QueryFactory'
import { createCacheKey } from '@/lib/cacheKeys'
import type { CustomerSupportProductsResponse, CustomerSupportProductsVariables } from '@/types/graphql'

export const QueryCustomerSupportProducts = new QueryFactory<
  CustomerSupportProductsResponse,
  CustomerSupportProductsVariables
>({
  queryName: 'CustomerSupportProducts',
  operationType: 'query',
  cacheOptions: {
    cacheable: true,
    cacheTTL: 300,
    cacheKey: (variables) =>
      createCacheKey('support:products', variables ? { ...variables } : undefined),
  },
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
