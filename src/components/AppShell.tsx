'use client'

import { ReactNode } from 'react'
import classNames from 'classnames'
import { useRTL, useTranslation } from '@/i18n'
import { getGraphqlDisplayEndpoint } from '@/config/env'
import { useAdminNavigation } from '@/routes/useAdminNavigation'
import styles from './AppShell.module.scss'
import { SupportSessionControls } from './SupportSessionControls'
import { LanguageSelector } from './LanguageSelector'
import { SidebarNavigation } from './SidebarNavigation'

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation('Common')
  const isRtl = useRTL()
  const { routes, activeLabel, pathname } = useAdminNavigation()
  const graphqlEndpoint = getGraphqlDisplayEndpoint()

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

          <SidebarNavigation
            routes={routes}
            pathname={pathname}
            className={styles.navList}
            linkClassName={styles.navLink}
            activeLinkClassName={styles.navLinkActive}
            emojiClassName={styles.navEmoji}
          />

          <div className={classNames('card', styles.endpointCard)}>
            <p className={styles.endpointLabel}>{t('app_shell.endpoint.label')}</p>
            <p className={styles.endpointValue}>
              <span>
                {graphqlEndpoint ?? t('app_shell.endpoint.fallback')}
              </span>
            </p>
          </div>
        </div>
      </aside>
      <div className={styles.contentArea}>
        <header className={styles.header}>
          <div>
            <p className={styles.headerMeta}>{t('app_shell.active_area.label')}</p>
            <h2 className={styles.headerTitle}>{activeLabel}</h2>
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
