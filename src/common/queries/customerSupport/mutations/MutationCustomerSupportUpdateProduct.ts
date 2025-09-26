import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportUpdateProductResponse,
  CustomerSupportUpdateProductVariables,
} from '@/types/graphql'

export const MutationCustomerSupportUpdateProduct = new QueryFactory<
  CustomerSupportUpdateProductResponse,
  CustomerSupportUpdateProductVariables
>({
  queryName: 'CustomerSupportUpdateProduct',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportUpdateProduct(
      $id: ID!
      $name: String
      $price: Float
      $description: String
      $categoryId: ID
      $image: ProductImageUploadInput
      $removeImage: Boolean
    ) {
      customerSupport {
        updateProduct(
          id: $id
          name: $name
          price: $price
          description: $description
          categoryId: $categoryId
          image: $image
          removeImage: $removeImage
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
