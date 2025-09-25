import type RootContext from '@/common/stores/RootContext'
import { DocumentNode, print } from 'graphql'

import type { GraphQLResponse } from './GraphQLResponse'

export type CacheOptions<V, R> = {
  cacheable: boolean
  cacheTTL?: number
  cacheKey?: (variables: V) => string | string
}

export interface QueryFactoryConfig<R, V> {
  queryName: string
  queryObject: DocumentNode | string
  operationType?: 'query' | 'mutation'
  cacheOptions?: CacheOptions<V, R>
  throwOnErrors?: boolean
  preProcess?: (rootContext: RootContext, variables: V) => Promise<V>
  preProcessClient?: (rootContext: RootContext, variables: V) => Promise<V>
  postProcess?: (
    rootContext: RootContext,
    response: GraphQLResponse<R>,
    variables: V,
  ) => Promise<GraphQLResponse<R>>
  postProcessClient?: (
    rootContext: RootContext,
    response: GraphQLResponse<R>,
  ) => Promise<GraphQLResponse<R>>
}

export class QueryFactory<R, V = Record<string, unknown>> implements QueryFactoryConfig<R, V> {
  queryName: string
  queryObject: DocumentNode | string
  operationType: 'query' | 'mutation'
  cacheOptions?: CacheOptions<V, R>
  throwOnErrors?: boolean
  preProcess?: QueryFactoryConfig<R, V>['preProcess']
  preProcessClient?: QueryFactoryConfig<R, V>['preProcessClient']
  postProcess?: QueryFactoryConfig<R, V>['postProcess']
  postProcessClient?: QueryFactoryConfig<R, V>['postProcessClient']

  queryString: string

  constructor(props: QueryFactoryConfig<R, V>) {
    this.queryName = props.queryName
    this.queryObject = props.queryObject
    this.operationType = props.operationType ?? 'query'
    this.cacheOptions = props.cacheOptions
    this.throwOnErrors = props.throwOnErrors
    this.preProcess = props.preProcess
    this.preProcessClient = props.preProcessClient
    this.postProcess = props.postProcess
    this.postProcessClient = props.postProcessClient

    this.queryString = typeof props.queryObject === 'string' ? props.queryObject : print(props.queryObject)
  }
}
