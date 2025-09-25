import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportCmsPageMutationResponse,
  CustomerSupportUpdateCmsPageVariables,
} from '@/types/graphql'

export const MutationCustomerSupportUpdateCmsPage = new QueryFactory<
  CustomerSupportCmsPageMutationResponse,
  CustomerSupportUpdateCmsPageVariables
>({
  queryName: 'CustomerSupportUpdateCmsPage',
  operationType: 'mutation',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportUpdateCmsPage($id: ID!, $input: CmsPageInput!) {
      customerSupport {
        updateCmsPage(id: $id, input: $input) {
          id
          slug
          title
          excerpt
          body
          status
          updatedAt
          publishedAt
        }
      }
    }
  `),
})
