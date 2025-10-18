'use client'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useStores } from '@/hooks/useStores'
import { useTranslation } from '@/i18n'
import styles from './SupportSessionControls.module.scss'

export const SupportSessionControls = observer(() => {
  const router = useRouter()
  const { t } = useTranslation('Common')
  const { userStore } = useStores()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    setLoading(true)
    setError(null)
    try {
      await userStore.logout()
      router.replace('/login')
      router.reload()
    } catch (err) {
      console.error('Failed to log out', err)
      const message =
        err instanceof Error
          ? err.message || t('support_session.errors.terminate_failed')
          : t('support_session.errors.terminate_failed')
      setError(message)
    }
    setLoading(false)
  }

  const displayName = userStore.sessionUser?.name || userStore.sessionUser?.email || '—'

  return (
    <div className={styles.container}>
      {userStore.sessionUser ? (
        <div className={styles.userRow}>
          <span className={styles.userLabel}>{t('support_session.user.label')}</span>
          <Link href="/profile" className={classNames('badge', styles.profileButton)}>
            {displayName}
          </Link>
        </div>
      ) : null}
      {error ? <span className={styles.error}>{error}</span> : null}
      <div className={styles.actions}>
        <button
          type="button"
          className={classNames('badge', styles.logoutButton)}
          onClick={handleLogout}
          disabled={loading}
        >
          {loading
            ? t('support_session.actions.signing_out')
            : t('support_session.actions.sign_out')}
        </button>
      </div>
    </div>
  )
})

export default SupportSessionControls
