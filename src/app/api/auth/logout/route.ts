import { NextRequest, NextResponse } from 'next/server'

import { getGraphqlUpstream } from '@/app/api/_lib/getGraphqlUpstream'

const GRAPHQL_ENDPOINT = getGraphqlUpstream()

const LOGOUT_MUTATION = /* GraphQL */ `
  mutation AdminPortalLogout {
    logout
  }
`

export async function POST(request: NextRequest) {
  let graphqlResponse: Response | null = null

  try {
    graphqlResponse = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('cookie')
          ? { cookie: request.headers.get('cookie') as string }
          : {}),
      },
      body: JSON.stringify({ query: LOGOUT_MUTATION }),
      cache: 'no-store',
    })
  } catch (err) {
    console.error('Failed to reach logout resolver', err)
  }

  const response = NextResponse.json({ ok: true })

  if (graphqlResponse) {
    const rawSetCookie =
      (graphqlResponse.headers as unknown as { raw?: () => Record<string, string[]> })
        .raw?.()['set-cookie'] || graphqlResponse.headers.get('set-cookie')

    if (Array.isArray(rawSetCookie)) {
      rawSetCookie.forEach((cookie) => response.headers.append('Set-Cookie', cookie))
    } else if (rawSetCookie) {
      response.headers.append('Set-Cookie', rawSetCookie)
    }
  } else {
    const isProduction = process.env.NODE_ENV === 'production'
    const fallback = `sid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
      isProduction ? '; Secure' : ''
    }`
    response.headers.append('Set-Cookie', fallback)
  }

  return response
}
