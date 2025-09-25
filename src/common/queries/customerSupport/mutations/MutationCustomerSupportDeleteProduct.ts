import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportDeleteProductResponse,
  CustomerSupportDeleteProductVariables,
} from '@/types/graphql'

export const MutationCustomerSupportDeleteProduct = new QueryFactory<
  CustomerSupportDeleteProductResponse,
  CustomerSupportDeleteProductVariables
>({
  queryName: 'CustomerSupportDeleteProduct',
  operationType: 'mutation',
  throwOnErrors: true,
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportDeleteProduct($id: ID!) {
      customerSupport {
        deleteProduct(id: $id)
      }
    }
  `),
})
