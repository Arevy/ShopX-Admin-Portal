import { GraphQLClient, ClientError } from 'graphql-request'
import type { Variables } from 'graphql-request'

import type { QueryFactory } from '@/common/queries/utils/QueryFactory'
import type { GraphQLResponse, GraphQLResponseError } from '@/common/queries/utils/GraphQLResponse'
import type RootContext from '@/common/stores/RootContext'

const DEFAULT_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql'

export class ApiService {
  private client: GraphQLClient
  private authToken?: string

  constructor(private readonly rootContext: RootContext, endpoint: string = DEFAULT_ENDPOINT) {
    this.client = new GraphQLClient(endpoint)
  }

  setAuthToken(token?: string) {
    this.authToken = token
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    this.client.setHeaders(headers)
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
