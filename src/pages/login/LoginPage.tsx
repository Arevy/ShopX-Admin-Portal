'use client'

import { FormEvent, Suspense, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import classNames from 'classnames'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useStores } from '@/hooks/useStores'
import { useRTL, useTranslation } from '@/i18n'
import route from './Route'
import styles from './LoginPage.module.scss'

const LoginForm = observer(() => {
  const router = useRouter()
  const { t } = useTranslation(route.translationNamespace)
  const isRtl = useRTL()
  const { userStore } = useStores()
  const [email, setEmail] = useState('support@example.com')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await userStore.login(email, password)
      const redirect =
        typeof router.query.redirect === 'string' ? router.query.redirect : '/dashboard'
      router.replace(redirect)
      router.reload()
    } catch (err) {
      console.error('Admin login failed', err)
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
            onChange={(event) => {
              setEmail(event.target.value)
              if (userStore.authError) {
                userStore.clearAuthError()
              }
            }}
            disabled={userStore.authLoading}
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
            onChange={(event) => {
              setPassword(event.target.value)
              if (userStore.authError) {
                userStore.clearAuthError()
              }
            }}
            disabled={userStore.authLoading}
            required
          />

          {userStore.authError ? <p className={styles.error}>{userStore.authError}</p> : null}

          <button
            type="submit"
            className={classNames('button', styles.submit)}
            disabled={userStore.authLoading}
          >
            {userStore.authLoading ? t('form.actions.signing_in') : t('form.actions.sign_in')}
          </button>
        </form>
        <div className={classNames(styles.localeSelector, { [styles.localeSelectorRtl]: isRtl })}>
          <LanguageSelector />
        </div>
      </div>
    </div>
  )
})

const LoginFallback = () => {
  const { t } = useTranslation(route.translationNamespace)
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
