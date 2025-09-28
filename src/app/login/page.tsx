'use client'

import { FormEvent, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import classNames from 'classnames'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useRTL, useTranslation } from '@/i18n'
import styles from './Login.module.scss'

const TRANSLATION_NAMESPACE = 'Page_Admin_Login'

const LoginForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation(TRANSLATION_NAMESPACE)
  const isRtl = useRTL()
  const [email, setEmail] = useState('support@example.com')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null
        setError(payload?.message ?? t('form.errors.credentials'))
        setSubmitting(false)
        return
      }

      const redirect = searchParams.get('redirect') ?? '/dashboard'
      router.replace(redirect)
      router.refresh()
    } catch (err) {
      console.error('Admin login failed', err)
      setError(t('form.errors.unexpected'))
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={classNames(styles.card, { [styles.cardRtl]: isRtl })}>
        <div className={styles.branding}>
          <span className={styles.brandIndicator} />
          <h1>{t('branding.title')}</h1>
          <p>{t('branding.subtitle')}</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="email">
            {t('form.labels.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={styles.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            required
          />

          <label className={styles.label} htmlFor="password">
            {t('form.labels.password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            required
          />

          {error ? <p className={styles.error}>{error}</p> : null}

          <button type="submit" className={classNames('button', styles.submit)} disabled={submitting}>
            {submitting ? t('form.actions.signing_in') : t('form.actions.sign_in')}
          </button>
        </form>
        <div className={classNames(styles.localeSelector, { [styles.localeSelectorRtl]: isRtl })}>
          <LanguageSelector />
        </div>
      </div>
    </div>
  )
}

const LoginFallback = () => {
  const { t } = useTranslation(TRANSLATION_NAMESPACE)
  const isRtl = useRTL()

  return (
    <div className={styles.container}>
      <div className={classNames(styles.card, { [styles.cardRtl]: isRtl })}>
        <div className={styles.branding}>
          <span className={styles.brandIndicator} />
          <h1>{t('branding.title')}</h1>
          <p>{t('branding.loading_message')}</p>
        </div>
        <div className={classNames(styles.localeSelector, { [styles.localeSelectorRtl]: isRtl })}>
          <LanguageSelector />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
