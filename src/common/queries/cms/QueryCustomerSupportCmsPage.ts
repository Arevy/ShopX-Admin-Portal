import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportCmsPageResponse,
  CustomerSupportCmsPageVariables,
} from '@/types/graphql'

export const QueryCustomerSupportCmsPage = new QueryFactory<
  CustomerSupportCmsPageResponse,
  CustomerSupportCmsPageVariables
>({
  queryName: 'CustomerSupportCmsPage',
  operationType: 'query',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    query CustomerSupportCmsPage($id: ID, $slug: String) {
      customerSupport {
        cmsPage(id: $id, slug: $slug) {
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
