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

  const activeRoute = useMemo(() => {
    const match = findRouteForPath(pathname)
    if (!match) {
      return undefined
    }

    return translatedRoutes.find((route) => route.id === match.id)
  }, [pathname, translatedRoutes])

  const activeLabel = activeRoute?.label ?? t('app_shell.navigation.overview')

  return {
    routes: translatedRoutes,
    activeRoute,
    activeLabel,
    pathname,
  }
}
