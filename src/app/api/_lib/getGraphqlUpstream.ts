const DEFAULT_UPSTREAM = 'http://localhost:4000/graphql'

const isAbsoluteUrl = (value: string | undefined): value is string =>
  typeof value === 'string' && /^(http|https):\/\//i.test(value)

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

export const getGraphqlUpstream = (): string => {
  const explicit =
    sanitizeEnv(process.env.GRAPHQL_UPSTREAM_ENDPOINT) ||
    sanitizeEnv(process.env.BACKEND_GRAPHQL_ENDPOINT) ||
    sanitizeEnv(process.env.ECOMMERCE_BACKEND_GRAPHQL_URL)

  if (explicit) {
    return explicit
  }

  const publicEndpoint = sanitizeEnv(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT)
  if (isAbsoluteUrl(publicEndpoint)) {
    return publicEndpoint
  }

  return DEFAULT_UPSTREAM
}

