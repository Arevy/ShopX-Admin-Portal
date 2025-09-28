'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useMemo } from 'react'
import classNames from 'classnames'
import { useRTL, useTranslation } from '@/i18n'
import styles from './AppShell.module.scss'
import { SupportSessionControls } from './SupportSessionControls'
import { LanguageSelector } from './LanguageSelector'

const navigation = [
  { key: 'overview', href: '/dashboard', emoji: '📊' },
  { key: 'orders', href: '/orders', emoji: '🧾' },
  { key: 'products', href: '/products', emoji: '🛒' },
  { key: 'customers', href: '/users', emoji: '👤' },
  { key: 'support', href: '/support', emoji: '💬' },
  { key: 'cms', href: '/cms', emoji: '📝' },
] as const

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()
  const { t } = useTranslation('Common')
  const isRtl = useRTL()

  const translatedNavigation = useMemo(
    () =>
      navigation.map((item) => ({
        ...item,
        label: t(`app_shell.navigation.${item.key}`),
      })),
    [t],
  )

  const activeSection = useMemo(() => {
    const activeItem = translatedNavigation.find((item) => pathname.startsWith(item.href))
    return activeItem?.label ?? t('app_shell.navigation.overview')
  }, [pathname, translatedNavigation, t])

  return (
    <div className={classNames(styles.container, { [styles.containerRtl]: isRtl })}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <div>
            <span className={styles.brandMeta}>
              <span className={styles.brandIndicator} />
              {t('app_shell.brand.meta')}
            </span>
            <h1 className={styles.brandTitle}>{t('app_shell.brand.title')}</h1>
            <p className={styles.brandSubtitle}>{t('app_shell.brand.subtitle')}</p>
          </div>

          <nav className={styles.navList}>
            {translatedNavigation.map((item) => {
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
            <p className={styles.endpointLabel}>{t('app_shell.endpoint.label')}</p>
            <p className={styles.endpointValue}>
              <span>
                {process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? t('app_shell.endpoint.fallback')}
              </span>
            </p>
          </div>
        </div>
      </aside>
      <div className={styles.contentArea}>
        <header className={styles.header}>
          <div>
            <p className={styles.headerMeta}>{t('app_shell.active_area.label')}</p>
            <h2 className={styles.headerTitle}>{activeSection}</h2>
          </div>
          <div className={styles.headerBadges}>
            <span className={classNames('badge', styles.badgeOnline)}>{t('app_shell.status.online')}</span>
            <span className="badge">{t('app_shell.badges.node_requirement')}</span>
            <SupportSessionControls />
          </div>
        </header>
        <main className={styles.main}>{children}</main>
        <footer className={styles.footer}>
          <LanguageSelector className={styles.footerLanguageSelector} />
          <span className={styles.footerNote}>{t('app_shell.footer.note')}</span>
        </footer>
      </div>
    </div>
  )
}
