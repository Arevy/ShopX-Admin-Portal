'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useMemo } from 'react'
import classNames from 'classnames'
import styles from './AppShell.module.scss'

const navigation = [
  { label: 'Overview', href: '/dashboard', emoji: '📊' },
  { label: 'Orders', href: '/orders', emoji: '🧾' },
  { label: 'Products', href: '/products', emoji: '🛒' },
  { label: 'Customers', href: '/users', emoji: '👤' },
  { label: 'Support Desk', href: '/support', emoji: '💬' },
]

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()

  const activeSection = useMemo(
    () => navigation.find((item) => pathname.startsWith(item.href))?.label ?? 'Overview',
    [pathname],
  )

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <div>
            <span className={styles.brandMeta}>
              <span className={styles.brandIndicator} />
              Realtime Control
            </span>
            <h1 className={styles.brandTitle}>ShopX Admin</h1>
            <p className={styles.brandSubtitle}>Customer success &amp; catalog automation cockpit.</p>
          </div>

          <nav className={styles.navList}>
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link key={item.href} href={item.href} legacyBehavior>
                  <a className={classNames(styles.navLink, { [styles.navLinkActive]: active })}>
                    <span className={styles.navEmoji}>{item.emoji}</span>
                    {item.label}
                  </a>
                </Link>
              )
            })}
          </nav>

          <div className={classNames('card', styles.endpointCard)}>
            <p className={styles.endpointLabel}>Backend endpoint</p>
            <p className={styles.endpointValue}>
              <span>{process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql'}</span>
            </p>
          </div>
        </div>
      </aside>
      <div className={styles.contentArea}>
        <header className={styles.header}>
          <div>
            <p className={styles.headerMeta}>Active area</p>
            <h2 className={styles.headerTitle}>{activeSection}</h2>
          </div>
          <div className={styles.headerBadges}>
            <span className={classNames('badge', styles.badgeOnline)}>● Online</span>
            <span className="badge">Node &gt;= 20 required</span>
          </div>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
