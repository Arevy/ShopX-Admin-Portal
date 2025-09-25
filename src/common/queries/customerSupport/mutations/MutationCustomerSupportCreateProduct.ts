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
    ) {
      customerSupport {
        addProduct(
          name: $name
          price: $price
          description: $description
          categoryId: $categoryId
        ) {
          id
          name
          price
          description
          categoryId
        }
      }
    }
  `),
})
