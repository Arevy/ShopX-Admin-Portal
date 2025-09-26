import { GraphQLClient, ClientError } from 'graphql-request'
import type { Variables } from 'graphql-request'

import type { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type { GraphQLResponse, GraphQLResponseError } from '@/common/queries/utils/GraphQLResponse'
import type RootContext from '@/common/stores/RootContext'

const isAbsoluteUrl = (value: string | undefined) =>
  typeof value === 'string' && /^https?:\/\//i.test(value)

const sanitizeEnv = (value: string | undefined) => {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  // Support inline comments in env files by trimming trailing " # comment" blocks
  const commentMatch = /\s#[^]*$/.exec(trimmed)
  if (commentMatch) {
    return trimmed.slice(0, commentMatch.index).trim() || undefined
  }

  return trimmed
}

const resolveOrigin = () => {
  const configured =
    sanitizeEnv(process.env.GRAPHQL_PROXY_ORIGIN) ||
    sanitizeEnv(process.env.NEXT_PUBLIC_APP_BASE_URL) ||
    sanitizeEnv(process.env.APP_BASE_URL) ||
    sanitizeEnv(process.env.VERCEL_URL)

  if (!configured) {
    return 'http://localhost:3000'
  }

  if (configured.startsWith('http://') || configured.startsWith('https://')) {
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
      // eslint-disable-next-line no-console
      console.error('Failed to resolve GraphQL endpoint in browser', { candidate, error })
    }
  }

  const origin = resolveOrigin()

  try {
    return new URL(candidate, origin).toString()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to resolve GraphQL endpoint on server', { candidate, origin, error })
    return `${origin}/api/support-graphql`
  }
}

const resolveEndpoint = () => {
  const explicit = sanitizeEnv(process.env.NEXT_PUBLIC_GRAPHQL_PROXY_ENDPOINT)
  const candidate = explicit || sanitizeEnv(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT) || '/api/support-graphql'

  return toAbsoluteUrl(candidate)
}

export class ApiService {
  private client: GraphQLClient

  constructor(private readonly rootContext: RootContext, endpoint?: string) {
    const resolvedEndpoint = endpoint ?? resolveEndpoint()

    if (typeof window === 'undefined') {
      // eslint-disable-next-line no-console
      console.info('[ApiService] GraphQL endpoint resolved to', resolvedEndpoint)
    }

    this.client = new GraphQLClient(resolvedEndpoint, {
      credentials: 'include',
    })
  }

  // Session cookies carry authentication; retaining this method keeps backwards compatibility.
  setAuthToken(token?: string) {
    if (token) {
      void token
    }
  }

  async executeGraphQL<R, V extends object | undefined = Record<string, unknown>>(
    queryFactory: QueryFactory<R, V>,
    variables?: V,
  ): Promise<GraphQLResponse<R>> {
    let processedVariables = variables

    if (processedVariables && queryFactory.preProcess) {
      const normalizedVariables = await queryFactory.preProcess(
        this.rootContext,
        processedVariables as NonNullable<V>,
      )
      processedVariables = normalizedVariables as V
    }
    if (processedVariables && queryFactory.preProcessClient) {
      const normalizedVariables = await queryFactory.preProcessClient(
        this.rootContext,
        processedVariables as NonNullable<V>,
      )
      processedVariables = normalizedVariables as V
    }

    try {
      const requestVariables = (processedVariables ?? undefined) as Variables | undefined
      const data = requestVariables
        ? await this.client.request<R>(queryFactory.queryString, requestVariables)
        : await this.client.request<R>(queryFactory.queryString)
      let response: GraphQLResponse<R> = { data }

      if (processedVariables && queryFactory.postProcess) {
        response = await queryFactory.postProcess(
          this.rootContext,
          response,
          processedVariables as NonNullable<V>,
        )
      }

      if (queryFactory.postProcessClient) {
        response = await queryFactory.postProcessClient(this.rootContext, response)
      }

      return response
    } catch (error) {
      if (error instanceof ClientError) {
        const graphQLErrors: GraphQLResponseError[] | undefined = error.response.errors?.map(
          (graphQLError) => ({
            message: graphQLError.message,
            locations: graphQLError.locations,
            path: graphQLError.path,
            extensions: graphQLError.extensions,
          }),
        )

        const response: GraphQLResponse<R> = {
          data: error.response.data as R,
          errors: graphQLErrors,
        }

        if (queryFactory.throwOnErrors) {
          throw error
        }

        if (processedVariables && queryFactory.postProcess) {
          return queryFactory.postProcess(
            this.rootContext,
            response,
            processedVariables as NonNullable<V>,
          )
        }

        return response
      }

      throw error
    }
  }
}

export default ApiService
