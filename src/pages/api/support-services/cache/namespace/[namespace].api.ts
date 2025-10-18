import type { NextApiRequest, NextApiResponse } from 'next'

import { redisCache } from '@/server/redis/cacheRepository'
import { requireApiToken } from '@/server/utils/requireApiToken'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!requireApiToken(req, res)) {
    return
  }

  const { namespace } = req.query

  if (typeof namespace !== 'string' || !namespace.trim()) {
    res.status(400).json({ error: 'Namespace is required.' })
    return
  }

  const pattern = namespace.endsWith('*') ? namespace : `${namespace}*`

  if (req.method === 'GET') {
    const keys = await redisCache.list(pattern)
    res.status(200).json({ keys })
    return
  }

  if (req.method === 'DELETE') {
    const removed = await redisCache.deletePattern(pattern)
    res.status(200).json({ removed })
    return
  }

  res.setHeader('Allow', 'GET, DELETE')
  res.status(405).json({ error: 'Method not allowed.' })
}

export default handler

