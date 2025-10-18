import type { NavigationRoute } from '@/routes/types'

export const TRANSLATION_NAMESPACE = 'Page_Admin_Support'

const supportRoute: NavigationRoute = {
  id: 'support',
  path: '/support',
  translationKey: 'app_shell.navigation.support',
  translationNamespace: TRANSLATION_NAMESPACE,
  emoji: '💬',
  order: 50,
}

export default supportRoute
