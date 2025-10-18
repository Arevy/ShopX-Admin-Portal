import { resolveRedisClient } from './client'
import { getRedisCachePrefix, getRedisDefaultTtl } from '@/config/env'

const CACHE_PREFIX = getRedisCachePrefix()

const qualifyKey = (key: string) => `${CACHE_PREFIX}:${key}`

const appendWildcard = (value: string) => (value.includes('*') ? value : `${value}*`)

const qualifyPattern = (pattern: string) => {
  if (!pattern) {
    return `${CACHE_PREFIX}:*`
  }

  if (pattern.startsWith(`${CACHE_PREFIX}:`)) {
    return appendWildcard(pattern)
  }

  return appendWildcard(`${CACHE_PREFIX}:${pattern}`)
}

const stripPrefix = (key: string) =>
  key.startsWith(`${CACHE_PREFIX}:`) ? key.slice(CACHE_PREFIX.length + 1) : key

export const redisCache = {
  async get<T>(key: string): Promise<T | undefined> {
    const client = await resolveRedisClient()
    if (!client) return undefined

    try {
      const value = await client.get(qualifyKey(key))
      if (!value) return undefined
      return JSON.parse(value) as T
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[Redis] failed to read cache', { key, error })
      }
      return undefined
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number) {
    const client = await resolveRedisClient()
    if (!client) return

    const payload = JSON.stringify(value)
    const ttl = ttlSeconds && ttlSeconds > 0 ? ttlSeconds : getRedisDefaultTtl()

    try {
      await client.set(qualifyKey(key), payload, 'EX', ttl)
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[Redis] failed to set cache', { key, error })
      }
    }
  },

  async delete(key: string) {
    const client = await resolveRedisClient()
    if (!client) return false

    try {
      const removed = await client.unlink(qualifyKey(key))
      return removed > 0
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[Redis] failed to delete cache key', { key, error })
      }
      return false
    }
  },

  async list(pattern = '*') {
    const client = await resolveRedisClient()
    if (!client) return []

    const namespacedPattern = qualifyPattern(pattern)

    try {
      const keys = await client.keys(namespacedPattern)
      return keys.map(stripPrefix)
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[Redis] failed to list cache keys', { pattern, error })
      }
      return []
    }
  },

  async getWithMetadata(key: string) {
    const client = await resolveRedisClient()
    if (!client) return { value: undefined, ttl: null as number | null }

    const namespacedKey = qualifyKey(key)

    try {
      const [value, ttl] = await Promise.all([client.get(namespacedKey), client.ttl(namespacedKey)])
      return {
        value: value ? JSON.parse(value) : undefined,
        ttl,
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[Redis] failed to inspect cache key', { key, error })
      }
      return { value: undefined, ttl: null as number | null }
    }
  },

  async deletePattern(pattern: string) {
    const client = await resolveRedisClient()
    if (!client) return 0

    const namespacedPattern = qualifyPattern(pattern)

    try {
      const keys = await client.keys(namespacedPattern)
      if (!keys.length) {
        return 0
      }
      const removed = await client.unlink(...keys)
      return removed
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[Redis] failed to delete pattern', { pattern, error })
      }
      return 0
    }
  },

  async clearAll() {
    return this.deletePattern('*')
  },
}

export type RedisCache = typeof redisCache
