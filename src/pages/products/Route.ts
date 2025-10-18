import type { NavigationRoute } from '@/routes/types'

export const TRANSLATION_NAMESPACE = 'Page_Admin_Products'

const productsRoute: NavigationRoute = {
  id: 'products',
  path: '/products',
  translationKey: 'app_shell.navigation.products',
  translationNamespace: TRANSLATION_NAMESPACE,
  emoji: '🛒',
  order: 30,
}

export default productsRoute
