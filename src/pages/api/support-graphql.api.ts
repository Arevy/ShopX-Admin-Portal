import type { NextApiRequest, NextApiResponse } from 'next'

import { getGraphqlUpstream } from '@/pages/api/_lib/getGraphqlUpstream'
import { getRedisDefaultTtl } from '@/config/env'
import { redisCache } from '@/server/redis/cacheRepository'
import { getOperationMetadata } from '@/server/graphql/operationMetadata'
import { createGraphqlCacheKey } from '@/server/graphql/executeWithCache'

const upstream = getGraphqlUpstream()

const hopByHopHeaders = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

const copyUpstreamHeaders = (response: Response, target: NextApiResponse) => {
  const setCookieHeaders: string[] = []

  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (hopByHopHeaders.has(lower)) {
      return
    }

    if (lower === 'set-cookie') {
      setCookieHeaders.push(value)
      return
    }

    target.setHeader(key, value)
  })

  if (setCookieHeaders.length > 0) {
    target.setHeader('Set-Cookie', setCookieHeaders)
  }
}

type GraphQLPayload = {
  query?: string
  variables?: Record<string, unknown>
  operationName?: string
}

type CachedGraphQLPayload = {
  data?: unknown
  errors?: unknown
}

const parseBody = (body: unknown): GraphQLPayload => {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as GraphQLPayload
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[support-graphql] failed to parse body', error)
      }
      return {}
    }
  }

  return (body ?? {}) as GraphQLPayload
}

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, OPTIONS')
    response.status(405).json({
      ok: false,
      message: 'Use POST for GraphQL operations.',
    })
    return
  }

  const payloadBody = parseBody(request.body)
  const { query, variables, operationName } = payloadBody

  if (!query) {
    response.status(400).json({ error: 'Missing GraphQL query.' })
    return
  }

  const cacheKeyHeader = request.headers['x-cache-key']
  const ttlHeader = request.headers['x-cache-ttl']
  const skipHeader = request.headers['x-cache-skip']

  const cacheKey = Array.isArray(cacheKeyHeader) ? cacheKeyHeader[0] : cacheKeyHeader
  const ttlSecondsRaw = Array.isArray(ttlHeader) ? ttlHeader[0] : ttlHeader
  const skipCacheFlag = Array.isArray(skipHeader) ? skipHeader[0] : skipHeader

  const ttlSeconds = ttlSecondsRaw ? Number(ttlSecondsRaw) : undefined
  const skipCache =
    skipCacheFlag === '1' ||
    skipCacheFlag === 'true' ||
    skipCacheFlag === 'yes'

  const metadata = getOperationMetadata(query)
  const shouldCache = metadata.type === 'query' && !skipCache

  const derivedCacheKey =
    cacheKey ??
    (shouldCache ? createGraphqlCacheKey(metadata.name, metadata.type, query, variables) : undefined)

  if (derivedCacheKey && shouldCache) {
    const cached = await redisCache.get<CachedGraphQLPayload>(derivedCacheKey)
    if (cached !== undefined) {
      response.setHeader('Content-Type', 'application/json')
      response.status(200).json(cached)
      return
    }
  }

  const upstreamHeaders: Record<string, string> = {
    'Content-Type': request.headers['content-type'] ?? 'application/json',
    Accept: request.headers.accept ?? 'application/json',
    'X-ShopX-Support-Session': '1',
  }

  if (request.headers.cookie) {
    upstreamHeaders.Cookie = request.headers.cookie
  }

  if (request.headers.authorization) {
    upstreamHeaders.Authorization = request.headers.authorization
  }

  if (request.headers.origin) {
    upstreamHeaders.Origin = request.headers.origin
  }

  const payload = JSON.stringify({
    query,
    variables,
    operationName,
  })

  let backendResponse: Response
  try {
    backendResponse = await fetch(upstream, {
      method: 'POST',
      headers: upstreamHeaders,
      body: payload,
      redirect: 'manual',
      cache: 'no-store',
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to reach GraphQL upstream', error)
    response.status(502).json({
      ok: false,
      message: 'Failed to contact GraphQL upstream.',
    })
    return
  }

  copyUpstreamHeaders(backendResponse, response)

  const text = await backendResponse.text()

  if (derivedCacheKey && shouldCache && backendResponse.ok) {
    try {
      const parsed = JSON.parse(text) as CachedGraphQLPayload
      if (!parsed.errors) {
        const ttl =
          Number.isFinite(ttlSeconds) && ttlSeconds && ttlSeconds > 0
            ? Number(ttlSeconds)
            : getRedisDefaultTtl()
        await redisCache.set(derivedCacheKey, parsed, ttl)
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[support-graphql] failed to cache response', error)
      }
    }
  }

  response.status(backendResponse.status).send(text)
}

export default handler
