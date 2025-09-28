'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from '@/i18n'
import styles from './SupportSessionControls.module.scss'

export const SupportSessionControls = () => {
  const router = useRouter()
  const { t } = useTranslation('Common')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null
        setError(payload?.message ?? t('support_session.errors.terminate_failed'))
        setLoading(false)
        return
      }
      router.replace('/login')
      router.refresh()
    } catch (err) {
      console.error('Failed to log out', err)
      setError(t('support_session.errors.unexpected'))
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {error ? <span className={styles.error}>{error}</span> : null}
      <button
        type="button"
        className={classNames('badge', styles.logoutButton)}
        onClick={handleLogout}
        disabled={loading}
      >
        {loading ? t('support_session.actions.signing_out') : t('support_session.actions.sign_out')}
      </button>
    </div>
  )
}

export default SupportSessionControls
