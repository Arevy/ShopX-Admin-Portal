import type { NavigationRoute } from '@/routes/types'

export const TRANSLATION_NAMESPACE = 'Page_Admin_Orders'

const ordersRoute: NavigationRoute = {
  id: 'orders',
  path: '/orders',
  translationKey: 'app_shell.navigation.orders',
  translationNamespace: TRANSLATION_NAMESPACE,
  emoji: '🧾',
  order: 20,
}

export default ordersRoute
