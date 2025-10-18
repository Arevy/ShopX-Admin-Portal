import type { RootStore } from '@/stores/rootStore'
import { DocumentNode, print } from 'graphql'

import type { GraphQLResponse } from './GraphQLResponse'

export type CacheOptions<V> = {
  cacheable: boolean
  cacheTTL?: number
  cacheKey?: string | ((variables: V | undefined) => string)
}

export interface QueryFactoryConfig<R, V> {
  queryName: string
  queryObject: DocumentNode | string
  operationType?: 'query' | 'mutation'
  cacheOptions?: CacheOptions<V>
  throwOnErrors?: boolean
  preProcess?: (rootStore: RootStore, variables: V) => Promise<V>
  preProcessClient?: (rootStore: RootStore, variables: V) => Promise<V>
  postProcess?: (
    rootStore: RootStore,
    response: GraphQLResponse<R>,
    variables: V,
  ) => Promise<GraphQLResponse<R>>
  postProcessClient?: (
    rootStore: RootStore,
    response: GraphQLResponse<R>,
  ) => Promise<GraphQLResponse<R>>
}

export class QueryFactory<R, V = Record<string, unknown>> implements QueryFactoryConfig<R, V> {
  queryName: string
  queryObject: DocumentNode | string
  operationType: 'query' | 'mutation'
  cacheOptions?: CacheOptions<V>
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
