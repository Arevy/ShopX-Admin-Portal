import type { NextApiRequest, NextApiResponse } from 'next'

import { getServerServicesToken } from '@/config/env'

const extractToken = (value: string | string[] | undefined) => {
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}

export const requireApiToken = (req: NextApiRequest, res: NextApiResponse): boolean => {
  const expected = getServerServicesToken()
  const provided = extractToken(req.query.api)

  if (provided && provided === expected) {
    return true
  }

  res.status(401).json({ error: 'Invalid API token.' })
  return false
}

