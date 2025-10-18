'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import getUserFriendlyMessage from '@/lib/getUserFriendlyMessage'
import { useTranslation } from '@/i18n'
import { useRootContext } from '@/stores/StoreProvider'

import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import styles from './SupportSessionGuard.module.scss'

type GuardStatus = 'checking' | 'ready' | 'error' | 'redirecting'

export const SupportSessionGuard = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const { t } = useTranslation('Common')
  const { supportStore } = useRootContext()

  const [status, setStatus] = useState<GuardStatus>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const redirectToLogin = () => {
      if (cancelled) return
      cancelled = true
      setStatus('redirecting')

      if (typeof window === 'undefined') {
        router.replace('/login')
        return
      }

      const url = new URL(window.location.href)
      const destination = `${url.pathname}${url.search}`.replace(/\/$/, '') || '/dashboard'
      const params = new URLSearchParams()
      params.set('redirect', destination)

      router.replace(`/login?${params.toString()}`)
    }

    const verifySession = async () => {
      try {
        const result = await supportStore.verifySession()

        if (cancelled) {
          return
        }

        if (result === 'unauthorized') {
          redirectToLogin()
          return
        }

        setStatus('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        const fallback = t('support_session.guard.failed')
        const message = getUserFriendlyMessage(error, fallback)

        setErrorMessage(message)
        setStatus('error')
      }
    }

    void verifySession()

    return () => {
      cancelled = true
    }
  }, [router, supportStore, t])

  if (status === 'checking' || status === 'redirecting') {
    return (
      <div className={styles.container}>
        <LoadingState label={t('support_session.guard.checking')} />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={styles.container}>
        <ErrorState message={errorMessage ?? t('support_session.guard.failed')} />
      </div>
    )
  }

  return <>{children}</>
}

export default SupportSessionGuard
