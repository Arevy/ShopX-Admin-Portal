import { parse } from 'graphql'

import { QueryFactory } from '@/graphql/utils/QueryFactory'
import type {
  CustomerSupportProductDetailResponse,
  CustomerSupportProductDetailVariables,
} from '@/types/graphql'

export const QueryCustomerSupportProductDetail = new QueryFactory<
  CustomerSupportProductDetailResponse,
  CustomerSupportProductDetailVariables
>({
  queryName: 'CustomerSupportProductDetail',
  operationType: 'query',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    query CustomerSupportProductDetail($id: ID!) {
      customerSupport {
        product(id: $id) {
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
