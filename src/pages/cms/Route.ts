import type { NavigationRoute } from '@/routes/types'

export const TRANSLATION_NAMESPACE = 'Page_Admin_Cms'

const cmsRoute: NavigationRoute = {
  id: 'cms',
  path: '/cms',
  translationKey: 'app_shell.navigation.cms',
  translationNamespace: TRANSLATION_NAMESPACE,
  emoji: '📝',
  order: 60,
}

export default cmsRoute
