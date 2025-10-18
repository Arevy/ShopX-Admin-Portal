'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/router'

import { useTranslation } from '@/i18n'
import { findRouteForPath, navigationRoutes } from '@/routes'
import type { NavigationRoute } from '@/routes/types'

export interface NavigationItem extends NavigationRoute {
  label: string
}

export const useAdminNavigation = () => {
  const router = useRouter()
  const rawPath = router.asPath ?? ''
  const normalizedPath = rawPath.split('#')[0] ?? ''
  const pathname = normalizedPath.split('?')[0] || '/'
  const { t } = useTranslation('Common')

  const translatedRoutes = useMemo<NavigationItem[]>(
    () =>
      navigationRoutes.map((route) => ({
        ...route,
        label: t(route.translationKey),
      })),
    [t],
  )

  const matchedRoute = useMemo(() => findRouteForPath(pathname), [pathname])

  const activeRoute = useMemo(() => {
    if (!matchedRoute) {
      return undefined
    }

    return translatedRoutes.find((route) => route.id === matchedRoute.id)
  }, [matchedRoute, translatedRoutes])

  const activeLabel = matchedRoute ? t(matchedRoute.translationKey) : t('app_shell.navigation.overview')

  return {
    routes: translatedRoutes,
    activeRoute,
    activeLabel,
    pathname,
  }
}
