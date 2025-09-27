import { NextRequest, NextResponse } from 'next/server'

import { getGraphqlUpstream } from '@/app/api/_lib/getGraphqlUpstream'
import { sanitizeErrorMessage } from '@/common/utils/getUserFriendlyMessage'

type LoginResponse = {
  data?: {
    login?: {
      token: string
      user: {
        id: number
        email: string
        name?: string | null
        role: string
      }
    }
  }
  errors?: Array<{ message: string }>
}

const LOGIN_MUTATION = /* GraphQL */ `
  mutation AdminPortalLogin($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        role
      }
    }
  }
`

const GRAPHQL_ENDPOINT = getGraphqlUpstream()

export async function POST(request: NextRequest) {
  const { email, password } = (await request.json()) as {
    email?: string
    password?: string
  }

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: 'Email and password are required.' },
      { status: 400 },
    )
  }

  const graphqlResponse = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: LOGIN_MUTATION,
      variables: { email, password },
    }),
    cache: 'no-store',
  })

  if (!graphqlResponse.ok) {
    return NextResponse.json(
      { ok: false, message: 'Authentication service unavailable.' },
      { status: 502 },
    )
  }

  const payload = (await graphqlResponse.json()) as LoginResponse

  if (payload.errors?.length) {
    const friendlyMessage =
      sanitizeErrorMessage(payload.errors[0]?.message) ?? 'Invalid email or password.'
    return NextResponse.json(
      { ok: false, message: friendlyMessage },
      { status: 401 },
    )
  }

  const session = payload.data?.login

  if (!session?.token || !session.user) {
    return NextResponse.json(
      { ok: false, message: 'Login failed.' },
      { status: 401 },
    )
  }

  if (session.user.role !== 'SUPPORT') {
    return NextResponse.json(
      { ok: false, message: 'Only support agents can access the admin portal.' },
      { status: 403 },
    )
  }

  const response = NextResponse.json({
    ok: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  })

  const rawSetCookie =
    (graphqlResponse.headers as unknown as { raw?: () => Record<string, string[]> })
      .raw?.()['set-cookie'] || graphqlResponse.headers.get('set-cookie')

  if (Array.isArray(rawSetCookie)) {
    rawSetCookie.forEach((cookie) => response.headers.append('Set-Cookie', cookie))
  } else if (rawSetCookie) {
    response.headers.append('Set-Cookie', rawSetCookie)
  }

  return response
}
