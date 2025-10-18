import type { NextApiRequest, NextApiResponse } from 'next'

import { MutationAdminPortalLogout } from '@/graphql/auth'
import { getGraphqlUpstream } from '@/pages/api/_lib/getGraphqlUpstream'

const GRAPHQL_ENDPOINT = getGraphqlUpstream()

const handler = async (request: NextApiRequest, response: NextApiResponse<{ ok: true }>) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ ok: true })
    return
  }

  let graphqlResponse: Response | null = null

  try {
    graphqlResponse = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.cookie ? { cookie: request.headers.cookie } : {}),
      },
      body: JSON.stringify({ query: MutationAdminPortalLogout.queryString }),
      cache: 'no-store',
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to reach logout resolver', error)
  }

  if (graphqlResponse) {
    const rawSetCookie =
      (graphqlResponse.headers as unknown as { raw?: () => Record<string, string[]> })
        .raw?.()['set-cookie'] || graphqlResponse.headers.get('set-cookie')

    if (Array.isArray(rawSetCookie)) {
      response.setHeader('Set-Cookie', rawSetCookie)
    } else if (rawSetCookie) {
      response.setHeader('Set-Cookie', rawSetCookie)
    }
  } else {
    const isProduction = process.env.NODE_ENV === 'production'
    const fallback = `sid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}`
    response.setHeader('Set-Cookie', fallback)
  }

  response.status(200).json({ ok: true })
}

export default handler
