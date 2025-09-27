import { ClientError } from 'graphql-request'

type KnownMessageRule = {
  match: RegExp | ((message: string) => boolean)
  value: string
}

type Options = {
  knownMessages?: KnownMessageRule[]
}

const GRAPHQL_PREFIX = /^GraphQL Error(?:\s*\(.*\))?:\s*/i
const JSON_SNIPPET = /"response"\s*:\s*\{|"request"\s*:\s*\{/i

const sanitize = (raw: string | null | undefined): string | null => {
  if (!raw) {
    return null
  }

  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  const withoutPrefix = trimmed.replace(GRAPHQL_PREFIX, '').trim()
  if (!withoutPrefix) {
    return null
  }

  if (JSON_SNIPPET.test(withoutPrefix) || withoutPrefix.startsWith('{') || withoutPrefix.startsWith('[')) {
    return null
  }

  return withoutPrefix
}

const resolveKnownMessage = (message: string, options?: Options): string | null => {
  if (!options?.knownMessages?.length) {
    return null
  }

  const rule = options.knownMessages.find(({ match }) => {
    if (typeof match === 'function') {
      return match(message)
    }

    return match.test(message)
  })

  return rule?.value ?? null
}

export const sanitizeErrorMessage = (raw: string | null | undefined): string | null =>
  sanitize(raw)

export const getUserFriendlyMessage = (
  error: unknown,
  fallback: string,
  options?: Options,
): string => {
  if (error instanceof ClientError) {
    const primary = sanitize(error.response.errors?.find((item) => item?.message)?.message)
    if (primary) {
      return resolveKnownMessage(primary, options) ?? primary
    }

    const status = error.response.status
    if (status === 401 || status === 403) {
      return 'You are not authorised to perform this action.'
    }
    if (status === 429) {
      return 'Too many requests. Please try again later.'
    }
    if (status >= 500) {
      return 'The service is temporarily unavailable. Please try again later.'
    }
  }

  if (error instanceof Error) {
    const message = sanitize(error.message)
    if (message) {
      return resolveKnownMessage(message, options) ?? message
    }
  }

  return fallback
}

export default getUserFriendlyMessage
