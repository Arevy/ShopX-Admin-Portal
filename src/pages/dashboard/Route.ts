import type { NavigationRoute } from '@/routes/types'

export const TRANSLATION_NAMESPACE = 'Page_Admin_Dashboard'

const dashboardRoute: NavigationRoute = {
  id: 'overview',
  path: '/dashboard',
  translationKey: 'app_shell.navigation.overview',
  translationNamespace: TRANSLATION_NAMESPACE,
  emoji: '📊',
  order: 10,
}

export default dashboardRoute
