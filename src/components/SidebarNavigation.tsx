import Link from 'next/link'
import classNames from 'classnames'

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
      const active = pathname === route.path || pathname.startsWith(`${route.path}/`)

      return (
        <Link key={route.path} href={route.path} legacyBehavior>
          <a className={classNames(linkClassName, active && activeLinkClassName)}>
            {route.emoji ? <span className={emojiClassName}>{route.emoji}</span> : null}
            {route.label}
          </a>
        </Link>
      )
    })}
  </nav>
)

