import { parse } from 'graphql'

import { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type { CustomerSupportSessionResponse } from '@/types/graphql'

const SUPPORT_SESSION_OPERATION = parse(/* GraphQL */ `
  query CustomerSupportSession {
    customerSupport {
      __typename
    }
  }
`)

export const QueryCustomerSupportSession = new QueryFactory<
  CustomerSupportSessionResponse,
  Record<string, never>
>({
  queryName: 'CustomerSupportSession',
  operationType: 'query',
  cacheOptions: { cacheable: false },
  queryObject: SUPPORT_SESSION_OPERATION,
})

export default QueryCustomerSupportSession
