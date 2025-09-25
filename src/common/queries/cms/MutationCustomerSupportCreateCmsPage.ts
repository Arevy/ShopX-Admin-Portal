import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type {
  CustomerSupportCmsPageMutationResponse,
  CustomerSupportCreateCmsPageVariables,
} from '@/types/graphql'

export const MutationCustomerSupportCreateCmsPage = new QueryFactory<
  CustomerSupportCmsPageMutationResponse,
  CustomerSupportCreateCmsPageVariables
>({
  queryName: 'CustomerSupportCreateCmsPage',
  operationType: 'mutation',
  cacheOptions: { cacheable: false },
  queryObject: parse(/* GraphQL */ `
    mutation CustomerSupportCreateCmsPage($input: CmsPageInput!) {
      customerSupport {
        createCmsPage(input: $input) {
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
