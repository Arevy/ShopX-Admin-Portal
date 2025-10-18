'use client'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { getStorefrontUrl } from '@/config/env'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useStores } from '@/hooks/useStores'
import { useTranslation } from '@/i18n'
import { getUserFriendlyMessage } from '@/lib/getUserFriendlyMessage'
import { TRANSLATION_NAMESPACE } from './Route'
import styles from './UserDetailPage.module.scss'

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
const ROLE_OPTIONS = ['CUSTOMER', 'SUPPORT'] as const

type Feedback = {
  tone: 'positive' | 'negative'
  message: string
} | null

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }
  return parsed.toLocaleString()
}

const UserDetailPage = observer(() => {
  const router = useRouter()
  const rawId = router.query.id
  const userId = Array.isArray(rawId) ? rawId[0] : rawId

  const { supportStore, userStore } = useStores()
  const { t } = useTranslation(TRANSLATION_NAMESPACE)
  const { t: tOrders } = useTranslation('Page_Admin_Orders')
  const { t: tUsers } = useTranslation('Page_Admin_Users')

  const profile = supportStore.customerProfile
  const user = profile?.user
  const loading = supportStore.profileLoading
  const loadError = supportStore.profileError

  const [profileForm, setProfileForm] = useState<{
    name: string
    email: string
    role: typeof ROLE_OPTIONS[number]
  }>({ name: '', email: '', role: ROLE_OPTIONS[0] })
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null)
  const [profileSubmitting, setProfileSubmitting] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' })
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  const [sessionsFeedback, setSessionsFeedback] = useState<Feedback>(null)
  const [impersonationFeedback, setImpersonationFeedback] = useState<Feedback>(null)

  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({})
  const [orderPending, setOrderPending] = useState<Record<string, boolean>>({})
  const [orderFeedback, setOrderFeedback] = useState<Feedback>(null)

  useEffect(() => {
    if (!router.isReady || !userId) {
      return
    }

    supportStore.resetCustomerProfile()
    void supportStore.loadCustomerProfile(userId)

    return () => {
      supportStore.resetCustomerProfile()
    }
  }, [router.isReady, userId, supportStore])

  useEffect(() => {
    if (!user) {
      return
    }

    setProfileForm({
      name: user.name ?? '',
      email: user.email,
      role: user.role,
    })

    setOrderDrafts(() => {
      const drafts: Record<string, string> = {}
      for (const order of profile?.orders ?? []) {
        drafts[order.id] = order.status
      }
      return drafts
    })
  }, [user, profile?.orders])

  const statusOptions = useMemo(() => STATUS_OPTIONS, [])

  const handleProfileSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!userId) {
        return
      }

      setProfileFeedback(null)

      if (!profileForm.email.trim()) {
        setProfileFeedback({ tone: 'negative', message: t('profile.feedback.email_required') })
        return
      }

      const updates: { name?: string; email?: string; role?: typeof ROLE_OPTIONS[number] } = {}

      const trimmedName = profileForm.name.trim()
      const trimmedEmail = profileForm.email.trim()

      if (!user || (user.name ?? '') !== trimmedName) {
        updates.name = trimmedName
      }

      if (!user || user.email !== trimmedEmail) {
        updates.email = trimmedEmail
      }

      if (!user || user.role !== profileForm.role) {
        updates.role = profileForm.role
      }

      if (!Object.keys(updates).length) {
        setProfileFeedback({ tone: 'negative', message: t('profile.feedback.nothing_to_update') })
        return
      }

      setProfileSubmitting(true)
      try {
        await userStore.updateUser(userId, updates)
        setProfileFeedback({ tone: 'positive', message: t('profile.feedback.success') })
        await supportStore.loadCustomerProfile(userId)
      } catch (error) {
        setProfileFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('profile.feedback.error')),
        })
      } finally {
        setProfileSubmitting(false)
      }
    },
    [userId, profileForm, user, t, userStore, supportStore],
  )

  const handlePasswordSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!userId) {
        return
      }

      setPasswordFeedback(null)

      const trimmed = passwordForm.password.trim()
      if (!trimmed) {
        setPasswordFeedback({ tone: 'negative', message: t('password.feedback.missing') })
        return
      }

      if (trimmed !== passwordForm.confirm.trim()) {
        setPasswordFeedback({ tone: 'negative', message: t('password.feedback.mismatch') })
        return
      }

      if (trimmed.length < 8) {
        setPasswordFeedback({ tone: 'negative', message: t('password.feedback.length') })
        return
      }

      setPasswordSubmitting(true)
      try {
        await userStore.updateUser(userId, { password: trimmed })
        setPasswordFeedback({ tone: 'positive', message: t('password.feedback.success') })
        setPasswordForm({ password: '', confirm: '' })
      } catch (error) {
        setPasswordFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('password.feedback.error')),
        })
      } finally {
        setPasswordSubmitting(false)
      }
    },
    [userId, passwordForm, t, userStore],
  )

  const handleOrderChange = useCallback((orderId: string, status: string) => {
    setOrderDrafts((prev) => ({ ...prev, [orderId]: status }))
  }, [])

  const handleOrderSubmit = useCallback(
    async (orderId: string) => {
      if (!userId) {
        return
      }

      const nextStatus = orderDrafts[orderId]
      if (!nextStatus) {
        return
      }

      setOrderPending((prev) => ({ ...prev, [orderId]: true }))
      setOrderFeedback(null)
      try {
        await userStore.updateOrderStatus(orderId, nextStatus)
        await supportStore.loadCustomerProfile(userId)
        setOrderFeedback({
          tone: 'positive',
          message: t('orders.feedback.success', {
            id: orderId,
            status: tOrders(`statuses.${nextStatus.toLowerCase()}`),
          }),
        })
      } catch (error) {
        setOrderFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('orders.feedback.error')),
        })
      } finally {
        setOrderPending((prev) => ({ ...prev, [orderId]: false }))
      }
    },
    [orderDrafts, userId, userStore, supportStore, t, tOrders],
  )

  const handleForceLogout = useCallback(async () => {
    if (!userId) return
    setSessionsFeedback(null)
    try {
      const revoked = await userStore.logoutUserSessions(userId)
      setSessionsFeedback({
        tone: 'positive',
        message: revoked ? tUsers('feedback.success.sessions_revoked') : tUsers('feedback.info.no_sessions'),
      })
    } catch (error) {
      setSessionsFeedback({
        tone: 'negative',
        message: getUserFriendlyMessage(error, tUsers('feedback.errors.sessions_revoke')),
      })
    }
  }, [userId, userStore, tUsers])

  const handleImpersonate = useCallback(async () => {
    if (!userId) return
    setImpersonationFeedback(null)
    try {
      const ticket = await userStore.impersonateUser(userId)
      if (!ticket) {
        throw new Error(tUsers('feedback.errors.impersonation_ticket'))
      }
      if (typeof window === 'undefined') {
        throw new Error(tUsers('feedback.errors.impersonation_browser'))
      }
      const baseUrl = getStorefrontUrl().replace(/\/$/, '')
      const target = `${baseUrl}/impersonate?token=${ticket.token}`
      window.open(target, '_blank', 'noopener')
      setImpersonationFeedback({ tone: 'positive', message: tUsers('feedback.success.impersonation') })
    } catch (error) {
      setImpersonationFeedback({
        tone: 'negative',
        message: getUserFriendlyMessage(error, tUsers('feedback.errors.impersonation')),
      })
    }
  }, [userId, userStore, tUsers])

  if (!userId) {
    return <ErrorState message={t('errors.missing_user')} />
  }

  if (loading && !profile) {
    return (
      <div className={styles.loadingState}>
        <Link href="/users" className={styles.backLink}>
          {t('navigation.back')}
        </Link>
        <LoadingState label={t('loading')} />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={styles.loadingState}>
        <Link href="/users" className={styles.backLink}>
          {t('navigation.back')}
        </Link>
        <ErrorState message={loadError} />
      </div>
    )
  }

  const addresses = profile?.addresses ?? []
  const orders = profile?.orders ?? []

  return (
    <div className={styles.page}>
      <Link href="/users" className={styles.backLink}>
        {t('navigation.back')}
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{t('header.title')}</h1>
        <p className={styles.subtitle}>{t('header.subtitle', { id: user?.id ?? userId })}</p>
      </header>

      <section className={styles.metaGrid}>
        <div className={styles.metaItem}>{t('meta.user_id', { id: user?.id ?? userId })}</div>
        <div className={styles.metaItem}>{t('meta.email', { email: user?.email ?? '—' })}</div>
        <div className={styles.metaItem}>{t('meta.role', { role: user ? tUsers(`roles.labels.${user.role.toLowerCase()}`) : '—' })}</div>
      </section>

      <div className={styles.contentGrid}>
        <section className={classNames('surface-border', styles.card)}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('profile.title')}</h2>
            <p className={styles.sectionDescription}>{t('profile.subtitle')}</p>
          </div>

          <form className={styles.formGrid} onSubmit={handleProfileSubmit}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('profile.form.name_label')}</span>
              <input
                value={profileForm.name}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={t('profile.form.name_placeholder')}
                disabled={profileSubmitting}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('profile.form.email_label')}</span>
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder={t('profile.form.email_placeholder')}
                disabled={profileSubmitting}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('profile.form.role_label')}</span>
              <select
                value={profileForm.role}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, role: event.target.value as typeof ROLE_OPTIONS[number] }))
                }
                disabled={profileSubmitting}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {tUsers(`roles.labels.${role.toLowerCase()}`)}
                  </option>
                ))}
              </select>
            </div>

            {profileFeedback ? (
              <span
                className={
                  profileFeedback.tone === 'positive' ? styles.successMessage : styles.errorMessage
                }
              >
                {profileFeedback.message}
              </span>
            ) : null}

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton} disabled={profileSubmitting}>
                {profileSubmitting ? t('profile.form.submitting') : t('profile.form.submit')}
              </button>
            </div>
          </form>
        </section>

        <section className={classNames('surface-border', styles.card)}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('password.title')}</h2>
            <p className={styles.sectionDescription}>{t('password.subtitle')}</p>
          </div>

          <form className={styles.formGrid} onSubmit={handlePasswordSubmit}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('password.form.new_label')}</span>
              <input
                type="password"
                value={passwordForm.password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder={t('password.form.new_placeholder')}
                disabled={passwordSubmitting}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('password.form.confirm_label')}</span>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))
                }
                placeholder={t('password.form.confirm_placeholder')}
                disabled={passwordSubmitting}
              />
            </div>

            {passwordFeedback ? (
              <span
                className={
                  passwordFeedback.tone === 'positive' ? styles.successMessage : styles.errorMessage
                }
              >
                {passwordFeedback.message}
              </span>
            ) : null}

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton} disabled={passwordSubmitting}>
                {passwordSubmitting ? t('password.form.submitting') : t('password.form.submit')}
              </button>
            </div>
          </form>
        </section>

        <section className={classNames('surface-border', styles.card)}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('orders.title')}</h2>
            <p className={styles.sectionDescription}>{t('orders.subtitle')}</p>
          </div>

          {orderFeedback ? (
            <p
              className={classNames(styles.orderFeedback, {
                [styles.successMessage]: orderFeedback.tone === 'positive',
                [styles.errorMessage]: orderFeedback.tone === 'negative',
              })}
            >
              {orderFeedback.message}
            </p>
          ) : null}

          <div className={styles.ordersList}>
            {orders.length === 0 ? (
              <span className={styles.muted}>{t('orders.empty')}</span>
            ) : (
              orders.map((order) => (
                <div key={order.id} className={styles.orderItem}>
                  <div className={styles.orderMeta}>
                    <span className={styles.badge}>{t('orders.meta.id', { id: order.id })}</span>
                    <span>{t('orders.meta.total', { total: order.total.toFixed(2) })}</span>
                    <span>{t('orders.meta.created', { value: formatDateTime(order.createdAt) })}</span>
                  </div>
                  <div className={styles.orderActions}>
                    <select
                      className={styles.statusSelect}
                      value={orderDrafts[order.id] ?? order.status}
                      onChange={(event) => handleOrderChange(order.id, event.target.value)}
                      disabled={orderPending[order.id]}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {tOrders(`statuses.${status.toLowerCase()}`)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => void handleOrderSubmit(order.id)}
                      disabled={orderPending[order.id] || (orderDrafts[order.id] ?? order.status) === order.status}
                    >
                      {orderPending[order.id] ? t('orders.actions.pending') : t('orders.actions.apply')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={classNames('surface-border', styles.card)}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('addresses.title')}</h2>
            <p className={styles.sectionDescription}>{t('addresses.subtitle')}</p>
          </div>
          <div className={styles.list}>
            {addresses.length === 0 ? (
              <span className={styles.muted}>{t('addresses.empty')}</span>
            ) : (
              addresses.map((address) => (
                <div key={address.id}>
                  <strong>{address.street}</strong>
                  <div className={styles.muted}>
                    {address.city}, {address.postalCode}, {address.country}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={classNames('surface-border', styles.card)}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('actions.title')}</h2>
            <p className={styles.sectionDescription}>{t('actions.subtitle')}</p>
          </div>
          <div className={styles.actionsInline}>
            <button type="button" className={styles.secondaryButton} onClick={handleForceLogout}>
              {t('actions.force_logout')}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleImpersonate}>
              {t('actions.impersonate')}
            </button>
          </div>
          {sessionsFeedback ? (
            <span
              className={
                sessionsFeedback.tone === 'positive' ? styles.successMessage : styles.errorMessage
              }
            >
              {sessionsFeedback.message}
            </span>
          ) : null}
          {impersonationFeedback ? (
            <span
              className={
                impersonationFeedback.tone === 'positive' ? styles.successMessage : styles.errorMessage
              }
            >
              {impersonationFeedback.message}
            </span>
          ) : null}
        </section>
      </div>
    </div>
  )
})

export default UserDetailPage
