import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportCreateProductResponse,
  CustomerSupportCreateProductVariables,
} from '@/types/graphql'

export const MutationCustomerSupportCreateProduct = new QueryFactory<
  CustomerSupportCreateProductResponse,
  CustomerSupportCreateProductVariables
>({
  queryName: 'CustomerSupportCreateProduct',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportCreateProduct(
      $name: String!
      $price: Float!
      $description: String
      $categoryId: ID!
      $image: ProductImageUploadInput
    ) {
      customerSupport {
        addProduct(
          name: $name
          price: $price
          description: $description
          categoryId: $categoryId
          image: $image
        ) {
          id
          name
          price
          description
          categoryId
          image {
            url
            filename
            mimeType
            updatedAt
          }
        }
      }
    }
  `),
})
