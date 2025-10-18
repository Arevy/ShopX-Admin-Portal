import { GraphQLClient, ClientError } from 'graphql-request'
import type { Variables } from 'graphql-request'

import type { QueryFactory } from '@/graphql/utils/QueryFactory'
import type { GraphQLResponse, GraphQLResponseError } from '@/graphql/utils/GraphQLResponse'
import type { RootStore } from '@/stores/rootStore'
import { getGraphqlClientEndpoint } from '@/config/env'

export class ApiService {
  private readonly client: GraphQLClient

  constructor(private readonly rootStore: RootStore, endpoint?: string) {
    const resolvedEndpoint = endpoint ?? getGraphqlClientEndpoint()

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
        this.rootStore,
        processedVariables as NonNullable<V>,
      )
      processedVariables = normalizedVariables as V
    }

    if (processedVariables && queryFactory.preProcessClient) {
      const normalizedVariables = await queryFactory.preProcessClient(
        this.rootStore,
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
          this.rootStore,
          response,
          processedVariables as NonNullable<V>,
        )
      }

      if (queryFactory.postProcessClient) {
        response = await queryFactory.postProcessClient(this.rootStore, response)
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
            this.rootStore,
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
