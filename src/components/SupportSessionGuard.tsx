'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClientError } from 'graphql-request'

import { QueryCustomerSupportSession } from '@/common/queries/customerSupport/QueryCustomerSupportSession'
import getUserFriendlyMessage from '@/common/utils/getUserFriendlyMessage'
import { useTranslation } from '@/i18n'
import { useRootContext } from '@/stores/provider'

import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import styles from './SupportSessionGuard.module.scss'

const SUPPORT_AUTH_ERROR = /support authentication required/i

type GuardStatus = 'checking' | 'ready' | 'error' | 'redirecting'

const isUnauthorizedError = (error: unknown): boolean => {
  if (error instanceof ClientError) {
    if (error.response.status === 401 || error.response.status === 403) {
      return true
    }

    return Boolean(
      error.response.errors?.some((graphQLError) =>
        SUPPORT_AUTH_ERROR.test(graphQLError.message ?? ''),
      ),
    )
  }

  if (error instanceof Error) {
    return SUPPORT_AUTH_ERROR.test(error.message)
  }

  return false
}

export const SupportSessionGuard = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const { t } = useTranslation('Common')
  const rootContext = useRootContext()

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
        const response = await rootContext.apiService.executeGraphQL(
          QueryCustomerSupportSession,
        )

        if (cancelled) {
          return
        }

        const unauthorized = Boolean(
          response.errors?.some((graphQLError) =>
            SUPPORT_AUTH_ERROR.test(graphQLError.message ?? ''),
          ),
        )

        if (unauthorized || !response.data?.customerSupport) {
          redirectToLogin()
          return
        }

        setStatus('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        if (isUnauthorizedError(error)) {
          redirectToLogin()
          return
        }

        const fallback = t('support_session.guard.failed')
        const message = getUserFriendlyMessage(error, fallback, {
          knownMessages: [
            {
              match: SUPPORT_AUTH_ERROR,
              value: fallback,
            },
          ],
        })

        setErrorMessage(message)
        setStatus('error')
      }
    }

    void verifySession()

    return () => {
      cancelled = true
    }
  }, [rootContext, router, t])

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
