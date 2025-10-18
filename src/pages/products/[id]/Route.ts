import type { RouteDefinition } from '@/routes/types'

export const TRANSLATION_NAMESPACE = 'Page_Admin_ProductDetail'

const productDetailRoute: RouteDefinition = {
  id: 'product_detail',
  path: '/products/[id]',
  translationKey: 'Page_Admin_ProductDetail.header.title',
  translationNamespace: TRANSLATION_NAMESPACE,
  showInNavigation: false,
  match: (pathname) => /^\/products\/(?:[^/]+)$/.test(pathname),
}

export default productDetailRoute
