import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportCmsPagesResponse,
  CustomerSupportCmsPagesVariables,
} from '@/types/graphql'

export const QueryCustomerSupportCmsPages = new QueryFactory<
  CustomerSupportCmsPagesResponse,
  CustomerSupportCmsPagesVariables
>({
  queryName: 'CustomerSupportCmsPages',
  operationType: 'query',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    query CustomerSupportCmsPages($status: CmsStatus, $search: String) {
      customerSupport {
        cmsPages(status: $status, search: $search) {
          id
          slug
          title
          excerpt
          status
          updatedAt
          publishedAt
        }
      }
    }
  `),
})
