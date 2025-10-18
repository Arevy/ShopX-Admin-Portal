import type { NextApiRequest, NextApiResponse } from 'next'

import { redisCache } from '@/server/redis/cacheRepository'
import { requireApiToken } from '@/server/utils/requireApiToken'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!requireApiToken(req, res)) {
    return
  }

  switch (req.method) {
    case 'GET': {
      const keys = await redisCache.list()
      res.status(200).json({ keys })
      return
    }
    case 'DELETE': {
      const removed = await redisCache.clearAll()
      res.status(200).json({ removed })
      return
    }
    case 'POST': {
      const rawBody = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {}
      const action = rawBody.action ?? 'noop'
      const namespace = rawBody.namespace

      if (action === 'flushAll') {
        const removed = await redisCache.clearAll()
        res.status(200).json({ removed })
        return
      }

      if (action === 'flushNamespace') {
        if (typeof namespace !== 'string' || !namespace.trim()) {
          res.status(400).json({ error: 'namespace is required for flushNamespace' })
          return
        }
        const pattern = namespace.endsWith('*') ? namespace : `${namespace}*`
        const removed = await redisCache.deletePattern(pattern)
        res.status(200).json({ removed, namespace: pattern })
        return
      }

      if (action === 'flushKey') {
        if (typeof namespace !== 'string' || !namespace.trim()) {
          res.status(400).json({ error: 'key is required for flushKey' })
          return
        }
        const removed = await redisCache.delete(namespace)
        res.status(200).json({ removed, key: namespace })
        return
      }

      res.status(200).json({ message: 'noop', action })
      return
    }
    default: {
      res.setHeader('Allow', 'GET, POST, DELETE')
      res.status(405).json({ error: 'Method not allowed.' })
    }
  }
}

export default handler

