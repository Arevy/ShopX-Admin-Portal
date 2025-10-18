import type { NextApiRequest, NextApiResponse } from 'next'

import { redisCache } from '@/server/redis/cacheRepository'
import { requireApiToken } from '@/server/utils/requireApiToken'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!requireApiToken(req, res)) {
    return
  }

  const { key } = req.query

  if (typeof key !== 'string') {
    res.status(400).json({ error: 'Invalid cache key.' })
    return
  }

  if (req.method === 'GET') {
    const entry = await redisCache.getWithMetadata(key)
    res.status(200).json(entry)
    return
  }

  if (req.method === 'DELETE') {
    const removed = await redisCache.delete(key)
    res.status(200).json({ removed })
    return
  }

  res.setHeader('Allow', 'GET, DELETE')
  res.status(405).json({ error: 'Method not allowed.' })
}

export default handler

