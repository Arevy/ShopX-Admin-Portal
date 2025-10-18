import type { RouteDefinition } from '@/routes/types'

export const TRANSLATION_NAMESPACE = 'Page_Admin_Login'

const loginRoute: RouteDefinition = {
  id: 'login',
  path: '/login',
  translationKey: 'Page_Admin_Login.branding.title',
  translationNamespace: TRANSLATION_NAMESPACE,
  showInNavigation: false,
  order: 5,
  match: (pathname) => pathname === '/login' || pathname.startsWith('/login?'),
}

export default loginRoute
