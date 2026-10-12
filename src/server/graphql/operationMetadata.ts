import type { OperationTypeNode, DocumentNode } from 'graphql'
import { parse } from 'graphql'

export type OperationMetadata = {
  type: OperationTypeNode | 'unknown'
  name: string | null
}

const stripComments = (source: string) => source.replace(/^#.*$/gm, '').trim()

export const getOperationMetadata = (query: string): OperationMetadata => {
  try {
    const document: DocumentNode = parse(stripComments(query))
    const definition = document.definitions.find(
      (node) => node.kind === 'OperationDefinition',
    )

    if (definition && definition.kind === 'OperationDefinition') {
      const type = definition.operation
      const name = definition.name?.value ?? null
      return { type, name }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[GraphQL] Failed to parse operation metadata', error)
    }
  }

  return { type: 'unknown', name: null }
}
const publicFields = new Set([
  'getProducts', 'getProductById', 'getCategories', 'getReviews', 'getCmsPages', 'getCmsPage',
])

// Unknown, mixed, multi-operation and authenticated requests always reach the backend.
export const isPublicCacheableQuery = (
  query: string,
  headers?: Record<string, string | string[] | undefined>,
): boolean => {
  if (Object.entries(headers ?? {}).some(([key, value]) =>
    value && ['authorization', 'cookie'].includes(key.toLowerCase()))) return false
  try {
    const document = parse(query)
    const operations = document.definitions.filter(node => node.kind === 'OperationDefinition')
    if (operations.length !== 1 || operations[0].kind !== 'OperationDefinition' ||
        operations[0].operation !== 'query') return false
    const fragments = new Map(document.definitions.flatMap(node =>
      node.kind === 'FragmentDefinition' ? [[node.name.value, node] as const] : []))
    const check = (set: import('graphql').SelectionSetNode, seen = new Set<string>()): boolean =>
      set.selections.length > 0 && set.selections.every(node => {
        if (node.kind === 'Field') return publicFields.has(node.name.value)
        if (node.kind === 'InlineFragment') return check(node.selectionSet, seen)
        if (seen.has(node.name.value)) return false
        const fragment = fragments.get(node.name.value)
        return !!fragment && check(fragment.selectionSet, new Set([...seen, node.name.value]))
      })
    return check(operations[0].selectionSet)
  } catch { return false }
}

