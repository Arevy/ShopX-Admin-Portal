import type { NextApiRequest, NextApiResponse } from 'next'

import { MutationAdminPortalLogin } from '@/graphql/auth'
import type { GraphQLResponse } from '@/graphql/utils/GraphQLResponse'
import { sanitizeErrorMessage } from '@/lib/getUserFriendlyMessage'
import { getGraphqlUpstream } from '@/pages/api/_lib/getGraphqlUpstream'
import type { AdminPortalLoginResponse } from '@/types/graphql'

type ApiResponse =
  | {
      ok: true
      user: {
        id: number
        email: string
        name?: string | null
        role: string
      }
    }
  | {
      ok: false
      message: string
    }

const GRAPHQL_ENDPOINT = getGraphqlUpstream()

const handler = async (request: NextApiRequest, response: NextApiResponse<ApiResponse>) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ ok: false, message: 'Method Not Allowed' })
    return
  }

  const { email, password } = request.body ?? {}

  if (!email || !password) {
    response.status(400).json({ ok: false, message: 'Email and password are required.' })
    return
  }

  const graphqlResponse = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: MutationAdminPortalLogin.queryString,
      variables: { email, password },
    }),
    cache: 'no-store',
  })

  if (!graphqlResponse.ok) {
    response.status(502).json({ ok: false, message: 'Authentication service unavailable.' })
    return
  }

  const payload = (await graphqlResponse.json()) as GraphQLResponse<AdminPortalLoginResponse>

  if (payload.errors?.length) {
    const friendlyMessage =
      sanitizeErrorMessage(payload.errors[0]?.message) ?? 'Invalid email or password.'
    response.status(401).json({ ok: false, message: friendlyMessage })
    return
  }

  const session = payload.data?.login

  if (!session?.token || !session.user) {
    response.status(401).json({ ok: false, message: 'Login failed.' })
    return
  }

  if (session.user.role !== 'SUPPORT') {
    response.status(403).json({
      ok: false,
      message: 'Only support agents can access the admin portal.',
    })
    return
  }

  const rawHeaders =
    (graphqlResponse.headers as unknown as { raw?: () => Record<string, string[]> })
      .raw?.()['set-cookie'] || graphqlResponse.headers.get('set-cookie')

  if (Array.isArray(rawHeaders)) {
    response.setHeader('Set-Cookie', rawHeaders)
  } else if (rawHeaders) {
    response.setHeader('Set-Cookie', rawHeaders)
  }

  response.status(200).json({
    ok: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  })
}

export default handler
