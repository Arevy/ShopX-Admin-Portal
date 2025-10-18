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

