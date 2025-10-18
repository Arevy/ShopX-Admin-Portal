import dashboardRoute from '@/pages/dashboard/Route'
import ordersRoute from '@/pages/orders/Route'
import productsRoute from '@/pages/products/Route'
import usersRoute from '@/pages/users/Route'
import supportRoute from '@/pages/support/Route'
import cmsRoute from '@/pages/cms/Route'
import loginRoute from '@/pages/login/Route'
import profileRoute from '@/pages/profile/Route'
import type { NavigationRoute, RouteDefinition } from './types'

const toOrderKey = (route: RouteDefinition) => route.order ?? Number.MAX_SAFE_INTEGER

const rawNavigationRoutes: NavigationRoute[] = [
  dashboardRoute,
  ordersRoute,
  productsRoute,
  usersRoute,
  supportRoute,
  cmsRoute,
]

export const navigationRoutes = [...rawNavigationRoutes].sort((a, b) => toOrderKey(a) - toOrderKey(b))

const additionalRoutes: RouteDefinition[] = [loginRoute, profileRoute]

export const allRoutes: RouteDefinition[] = [...navigationRoutes, ...additionalRoutes].sort(
  (a, b) => toOrderKey(a) - toOrderKey(b),
)

const normalize = (pathname: string) => pathname.replace(/\/$/, '') || '/'

const matchesRoute = (route: RouteDefinition, pathname: string): boolean => {
  const target = normalize(pathname)
  const base = normalize(route.path)

  if (route.match) {
    return route.match(target)
  }

  return target === base || target.startsWith(`${base}/`)
}

export const findRouteForPath = (pathname: string): RouteDefinition | undefined => {
  const normalizedPath = normalize(pathname)
  return allRoutes.find((route) => matchesRoute(route, normalizedPath))
}
