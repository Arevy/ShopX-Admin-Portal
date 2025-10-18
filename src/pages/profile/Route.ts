import type { RouteDefinition } from '@/routes/types'

export const TRANSLATION_NAMESPACE = 'Page_Admin_Profile'

const profileRoute: RouteDefinition = {
  id: 'profile',
  path: '/profile',
  translationKey: 'app_shell.navigation.profile',
  translationNamespace: TRANSLATION_NAMESPACE,
  showInNavigation: false,
  order: 5,
}

export default profileRoute
