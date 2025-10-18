import type { NavigationRoute } from '@/routes/types'

export const TRANSLATION_NAMESPACE = 'Page_Admin_Users'

const usersRoute: NavigationRoute = {
  id: 'customers',
  path: '/users',
  translationKey: 'app_shell.navigation.customers',
  translationNamespace: TRANSLATION_NAMESPACE,
  emoji: '👤',
  order: 40,
}

export default usersRoute
