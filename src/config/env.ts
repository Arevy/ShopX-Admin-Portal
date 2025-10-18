const isAbsoluteUrl = (value: string | undefined): value is string =>
  typeof value === 'string' && /^https?:\/\//i.test(value)

const sanitizeEnv = (value: string | undefined) => {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const commentMatch = /\s#[^]*$/.exec(trimmed)
  if (commentMatch) {
    return trimmed.slice(0, commentMatch.index).trim() || undefined
  }

  return trimmed
}

const DEFAULT_GRAPHQL_UPSTREAM = 'http://localhost:4000/graphql'
const DEFAULT_STOREFRONT_URL = 'http://localhost:3100'
const DEFAULT_PROXY_PATH = '/api/support-graphql'
const DEFAULT_APP_BASE = 'http://localhost:3000'
const DEFAULT_SUPPORT_SERVICES_BASE = '/api/support-services'
const DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379'
const DEFAULT_CACHE_PREFIX = 'shopx:admin'
const DEFAULT_CACHE_TTL_SECONDS = 60
const DEFAULT_SERVER_SERVICES_TOKEN = 'development'

const resolveAppBaseUrl = () => {
  const configured =
    sanitizeEnv(process.env.GRAPHQL_PROXY_ORIGIN) ||
    sanitizeEnv(process.env.NEXT_PUBLIC_APP_BASE_URL) ||
    sanitizeEnv(process.env.APP_BASE_URL) ||
    sanitizeEnv(process.env.VERCEL_URL)

  if (!configured) {
    return DEFAULT_APP_BASE
  }

  if (isAbsoluteUrl(configured)) {
    return configured.replace(/\/$/, '')
  }

  return `https://${configured}`.replace(/\/$/, '')
}

const toAbsoluteUrl = (candidate: string): string => {
  if (isAbsoluteUrl(candidate)) {
    return candidate
  }

  if (typeof window !== 'undefined') {
    try {
      return new URL(candidate, window.location.origin).toString()
    } catch (error) {
      console.error('Failed to resolve GraphQL endpoint in browser', { candidate, error })
    }
  }

  const origin = resolveAppBaseUrl()

  try {
    return new URL(candidate, origin).toString()
  } catch (error) {
    console.error('Failed to resolve GraphQL endpoint on server', { candidate, origin, error })
    const normalizedCandidate = ensureLeadingSlash(candidate)
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin
    return `${normalizedOrigin}${normalizedCandidate}`
  }
}

const ensureLeadingSlash = (value: string): string => {
  if (!value) {
    return '/'
  }

  const firstChar = value[0] ?? ''
  return firstChar === '/' ? value : `/${value}`
}

export const getPublicGraphqlEndpoint = () => sanitizeEnv(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT)

export const getGraphqlProxyEndpoint = () =>
  sanitizeEnv(process.env.NEXT_PUBLIC_GRAPHQL_PROXY_ENDPOINT) ?? DEFAULT_PROXY_PATH

export const getGraphqlClientEndpoint = () => {
  const explicit = sanitizeEnv(process.env.NEXT_PUBLIC_GRAPHQL_PROXY_ENDPOINT)
  const candidate: string = explicit ?? getPublicGraphqlEndpoint() ?? DEFAULT_PROXY_PATH

  return toAbsoluteUrl(candidate)
}

export const getGraphqlUpstreamEndpoint = (): string => {
  const explicit =
    sanitizeEnv(process.env.GRAPHQL_UPSTREAM_ENDPOINT) ||
    sanitizeEnv(process.env.BACKEND_GRAPHQL_ENDPOINT) ||
    sanitizeEnv(process.env.ECOMMERCE_BACKEND_GRAPHQL_URL)

  if (explicit) {
    return explicit
  }

  const publicEndpoint = getPublicGraphqlEndpoint()
  if (isAbsoluteUrl(publicEndpoint)) {
    return publicEndpoint
  }

  return DEFAULT_GRAPHQL_UPSTREAM
}

export const getGraphqlDisplayEndpoint = () => getPublicGraphqlEndpoint()

export const getStorefrontUrl = () => sanitizeEnv(process.env.NEXT_PUBLIC_STOREFRONT_URL) ?? DEFAULT_STOREFRONT_URL

export const getSupportServicesBasePath = () =>
  sanitizeEnv(process.env.NEXT_PUBLIC_SUPPORT_SERVICES_BASE_PATH) ?? DEFAULT_SUPPORT_SERVICES_BASE

export const getRedisUrl = () => sanitizeEnv(process.env.REDIS_URL) ?? DEFAULT_REDIS_URL

export const getRedisCachePrefix = () =>
  sanitizeEnv(process.env.REDIS_CACHE_PREFIX) ?? DEFAULT_CACHE_PREFIX

export const getRedisDefaultTtl = () => {
  const raw = sanitizeEnv(process.env.REDIS_CACHE_TTL)
  if (!raw) return DEFAULT_CACHE_TTL_SECONDS

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_CACHE_TTL_SECONDS
  }

  return Math.floor(parsed)
}

export const getServerServicesToken = () =>
  sanitizeEnv(process.env.SERVER_SERVICES_TOKEN) ?? DEFAULT_SERVER_SERVICES_TOKEN

export const envUtils = {
  sanitizeEnv,
  getPublicGraphqlEndpoint,
  getGraphqlProxyEndpoint,
  getGraphqlClientEndpoint,
  getGraphqlUpstreamEndpoint,
  getGraphqlDisplayEndpoint,
  getStorefrontUrl,
  resolveAppBaseUrl,
  getSupportServicesBasePath,
  getRedisUrl,
  getRedisCachePrefix,
  getRedisDefaultTtl,
  getServerServicesToken,
}
