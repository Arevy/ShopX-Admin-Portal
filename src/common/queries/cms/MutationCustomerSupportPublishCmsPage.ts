import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type { CustomerSupportCmsPageMutationResponse, CustomerSupportCmsPageVariables } from '@/types/graphql'

export const MutationCustomerSupportPublishCmsPage = new QueryFactory<
  CustomerSupportCmsPageMutationResponse,
  CustomerSupportCmsPageVariables
>({
  queryName: 'CustomerSupportPublishCmsPage',
  operationType: 'mutation',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportPublishCmsPage($id: ID!) {
      customerSupport {
        publishCmsPage(id: $id) {
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
