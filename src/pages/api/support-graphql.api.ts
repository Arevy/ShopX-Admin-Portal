import type { NextApiRequest, NextApiResponse } from 'next'

import { getGraphqlUpstream } from '@/pages/api/_lib/getGraphqlUpstream'

const upstream = getGraphqlUpstream()

const hopByHopHeaders = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

const copyUpstreamHeaders = (response: Response, target: NextApiResponse) => {
  const setCookieHeaders: string[] = []

  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (hopByHopHeaders.has(lower)) {
      return
    }

    if (lower === 'set-cookie') {
      setCookieHeaders.push(value)
      return
    }

    target.setHeader(key, value)
  })

  if (setCookieHeaders.length > 0) {
    target.setHeader('Set-Cookie', setCookieHeaders)
  }
}

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, OPTIONS')
    response.status(405).json({
      ok: false,
      message: 'Use POST for GraphQL operations.',
    })
    return
  }

  const upstreamHeaders: Record<string, string> = {
    'Content-Type': request.headers['content-type'] ?? 'application/json',
    Accept: request.headers.accept ?? 'application/json',
    'X-ShopX-Support-Session': '1',
  }

  if (request.headers.cookie) {
    upstreamHeaders.Cookie = request.headers.cookie
  }

  if (request.headers.authorization) {
    upstreamHeaders.Authorization = request.headers.authorization
  }

  if (request.headers.origin) {
    upstreamHeaders.Origin = request.headers.origin
  }

  const payload =
    typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {})

  let backendResponse: Response
  try {
    backendResponse = await fetch(upstream, {
      method: 'POST',
      headers: upstreamHeaders,
      body: payload,
      redirect: 'manual',
      cache: 'no-store',
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to reach GraphQL upstream', error)
    response.status(502).json({
      ok: false,
      message: 'Failed to contact GraphQL upstream.',
    })
    return
  }

  copyUpstreamHeaders(backendResponse, response)

  const text = await backendResponse.text()
  response.status(backendResponse.status).send(text)
}

export default handler
