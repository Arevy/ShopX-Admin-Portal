import { NextRequest, NextResponse } from 'next/server'

const AUTH_COOKIE = 'sid'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value)

  if (pathname === '/login') {
    if (hasSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (!hasSession) {
    const redirectTarget = new URL('/login', request.url)
    const destination = `${pathname}${search}`.replace(/\/$/, '') || '/dashboard'
    redirectTarget.searchParams.set('redirect', destination)
    return NextResponse.redirect(redirectTarget)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
