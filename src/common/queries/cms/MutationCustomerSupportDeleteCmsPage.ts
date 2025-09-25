import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type { CustomerSupportCmsPageMutationResponse, CustomerSupportCmsPageVariables } from '@/types/graphql'

export const MutationCustomerSupportDeleteCmsPage = new QueryFactory<
  CustomerSupportCmsPageMutationResponse,
  CustomerSupportCmsPageVariables
>({
  queryName: 'CustomerSupportDeleteCmsPage',
  operationType: 'mutation',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportDeleteCmsPage($id: ID!) {
      customerSupport {
        deleteCmsPage(id: $id)
      }
    }
  `),
})
