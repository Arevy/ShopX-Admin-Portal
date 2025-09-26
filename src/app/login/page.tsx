'use client'

import { FormEvent, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import classNames from 'classnames'
import styles from './Login.module.scss'

const LoginForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
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
        setError(payload?.message ?? 'Login failed. Please try again.')
        setSubmitting(false)
        return
      }

      const redirect = searchParams.get('redirect') ?? '/dashboard'
      router.replace(redirect)
      router.refresh()
    } catch (err) {
      console.error('Admin login failed', err)
      setError('Unexpected error. Please retry.')
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.branding}>
          <span className={styles.brandIndicator} />
          <h1>ShopX Support Console</h1>
          <p>Authenticate with your support credentials to access the admin portal.</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="email">
            Support email
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
            Password
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
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.branding}>
              <span className={styles.brandIndicator} />
              <h1>ShopX Support Console</h1>
              <p>Loading login form…</p>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
