import Link from 'next/link'
import classNames from 'classnames'

import { NavigationIcon } from './NavigationIcon'

import type { NavigationItem } from '@/routes/useAdminNavigation'

interface SidebarNavigationProps {
  routes: NavigationItem[]
  pathname: string
  className?: string
  linkClassName?: string
  activeLinkClassName?: string
  emojiClassName?: string
}

export const SidebarNavigation = ({
  routes,
  pathname,
  className,
  linkClassName,
  activeLinkClassName,
  emojiClassName,
}: SidebarNavigationProps) => (
  <nav className={className}>
    {routes.map((route) => {
      const active =
        pathname === route.path || pathname.startsWith(`${route.path}/`)

      return (
        <Link key={route.path} href={route.path} legacyBehavior>
          <a
            aria-current={active ? 'page' : undefined}
            className={classNames(linkClassName, active && activeLinkClassName)}
          >
            <span className={emojiClassName}>
              <NavigationIcon path={route.path} />
            </span>
            {route.label}
          </a>
        </Link>
      )
    })}
  </nav>
)
