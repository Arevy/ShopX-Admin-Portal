import { NextRequest, NextResponse } from 'next/server'

import { getGraphqlUpstream } from '@/app/api/_lib/getGraphqlUpstream'

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

const copyUpstreamHeaders = (response: Response, target: Headers) => {
  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (hopByHopHeaders.has(lower)) {
      return
    }

    if (lower === 'set-cookie') {
      target.append('Set-Cookie', value)
      return
    }

    target.set(key, value)
  })
}

export async function POST(request: NextRequest) {
  const requestBody = await request.text()

  const upstreamHeaders: Record<string, string> = {
    'Content-Type': request.headers.get('content-type') ?? 'application/json',
    Accept: request.headers.get('accept') ?? 'application/json',
    'X-ShopX-Support-Session': '1',
  }

  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    upstreamHeaders.Cookie = cookieHeader
  }

  const authorization = request.headers.get('authorization')
  if (authorization) {
    upstreamHeaders.Authorization = authorization
  }

  const origin = request.headers.get('origin')
  if (origin) {
    upstreamHeaders.Origin = origin
  }

  let backendResponse: Response
  try {
    backendResponse = await fetch(upstream, {
      method: 'POST',
      headers: upstreamHeaders,
      body: requestBody,
      redirect: 'manual',
      cache: 'no-store',
    })
  } catch (err) {
    console.error('Failed to reach GraphQL upstream', err)
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to contact GraphQL upstream.',
      },
      { status: 502 },
    )
  }

  const responseHeaders = new Headers()
  copyUpstreamHeaders(backendResponse, responseHeaders)

  const payload = await backendResponse.text()

  return new NextResponse(payload, {
    status: backendResponse.status,
    headers: responseHeaders,
  })
}

export function GET() {
  return NextResponse.json(
    {
      ok: false,
      message: 'Use POST for GraphQL operations.',
    },
    { status: 405 },
  )
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
