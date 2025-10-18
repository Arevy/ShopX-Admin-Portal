import type { RouteDefinition } from '@/routes/types'

export const TRANSLATION_NAMESPACE = 'Page_Admin_UserDetail'

const userDetailRoute: RouteDefinition = {
  id: 'user_detail',
  path: '/users/[id]',
  translationKey: 'Page_Admin_UserDetail.header.title',
  translationNamespace: TRANSLATION_NAMESPACE,
  showInNavigation: false,
  match: (pathname) => /^\/users\/(?:[^/]+)$/.test(pathname),
}

export default userDetailRoute
