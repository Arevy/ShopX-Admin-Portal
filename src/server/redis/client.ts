import Redis from 'ioredis'

import { getRedisUrl } from '@/config/env'

let redisClient: Redis | null = null
let connectPromise: Promise<Redis | null> | null = null

const createClient = () =>
  new Redis(getRedisUrl(), {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
  })

export const resolveRedisClient = async (): Promise<Redis | null> => {
  if (redisClient) {
    return redisClient
  }

  if (!connectPromise) {
    const candidate = createClient()

    connectPromise = candidate
      .connect()
      .then(() => {
        redisClient = candidate
        candidate.on('error', (error) => {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[Redis] connection error', error)
          }
        })
        candidate.on('end', () => {
          redisClient = null
          connectPromise = null
        })
        return redisClient
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[Redis] failed to connect', error)
        }
        connectPromise = null
        return null
      })
  }

  return connectPromise
}

export const resetRedisClient = () => {
  redisClient = null
  connectPromise = null
}

