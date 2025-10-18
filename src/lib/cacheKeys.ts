const stableSerialize = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'null'
  }

  const type = typeof value

  if (type === 'number' || type === 'boolean') {
    return String(value)
  }

  if (type === 'string') {
    return JSON.stringify(value)
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString())
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`
  }

  if (type === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([entryKey, entryValue]) => `${JSON.stringify(entryKey)}:${stableSerialize(entryValue)}`)

    return `{${entries.join(',')}}`
  }

  return JSON.stringify(value)
}

export const createCacheKey = (
  namespace: string,
  ...parts: Array<unknown>
) => {
  const serializedParts = parts
    .filter((part) => part !== undefined && part !== null && part !== '')
    .map((part) => stableSerialize(part))

  if (!serializedParts.length) {
    return namespace
  }

  return `${namespace}:${serializedParts.join(':')}`
}
