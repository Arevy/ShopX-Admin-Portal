export interface GraphQLResponseError {
  message: string
  locations?: ReadonlyArray<{ line: number; column: number }>
  [prop: string]: unknown
}

export interface GraphQLResponse<T> {
  data?: T
  errors?: GraphQLResponseError[]
}
