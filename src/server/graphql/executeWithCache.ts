import { createHash } from 'node:crypto'

import type { Variables } from 'graphql-request'
import { GraphQLClient } from 'graphql-request'

import { redisCache } from '@/server/redis/cacheRepository'
import { getRedisDefaultTtl } from '@/config/env'

import { getOperationMetadata } from './operationMetadata'

export type ExecuteWithCacheOptions = {
  cacheKey?: string
  skipCache?: boolean
  ttlSeconds?: number
  requestHeaders?: Record<string, string | undefined>
}

const hashVariables = (variables?: Variables) => {
  if (!variables) return ''

  try {
    return JSON.stringify(variables)
  } catch {
    return ''
  }
}

export const createGraphqlCacheKey = (
  operationName: string | null,
  operationType: string,
  query: string,
  variables?: Variables,
) => {
  const digest = createHash('sha256')
    .update(query)
    .update(hashVariables(variables))
    .digest('hex')

  const normalizedName = operationName ?? 'anonymous'
  const normalizedType = operationType || 'unknown'

  return `graphql:${normalizedType}:${normalizedName}:${digest}`
}

const sanitizeHeaders = (headers?: Record<string, string | undefined>) => {
  if (!headers) return undefined

  const filteredEntries = Object.entries(headers).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  )

  if (!filteredEntries.length) {
    return undefined
  }

  return Object.fromEntries(filteredEntries)
}

export const executeWithCache = async <TData>(
  client: GraphQLClient,
  query: string,
  variables?: Variables,
  options: ExecuteWithCacheOptions = {},
): Promise<TData> => {
  const metadata = getOperationMetadata(query)
  const shouldCache = metadata.type === 'query' && !options.skipCache
  const cacheKey = options.cacheKey ?? (shouldCache
    ? createGraphqlCacheKey(metadata.name, metadata.type, query, variables)
    : undefined)

  if (shouldCache && cacheKey) {
    const cached = await redisCache.get<TData>(cacheKey)
    if (cached !== undefined) {
      return cached
    }
  }

  const requestHeaders = sanitizeHeaders(options.requestHeaders)

  const data = await client.request<TData>(
    query,
    variables,
    requestHeaders,
  )

  if (shouldCache && cacheKey) {
    const ttl = options.ttlSeconds && options.ttlSeconds > 0 ? options.ttlSeconds : getRedisDefaultTtl()
    await redisCache.set(cacheKey, data, ttl)
  }

  return data
}

