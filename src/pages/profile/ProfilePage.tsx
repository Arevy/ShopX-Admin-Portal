'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { useStores } from '@/hooks/useStores'
import { useTranslation } from '@/i18n'
import route from './Route'
import styles from './ProfilePage.module.scss'

const ProfilePage = observer(() => {
  const { userStore } = useStores()
  const { t } = useTranslation(route.translationNamespace)

  const sessionUser = userStore.sessionUser

  const [allowProfileEdit, setAllowProfileEdit] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: sessionUser?.name ?? '',
    email: sessionUser?.email ?? '',
  })
  const [profilePassword, setProfilePassword] = useState('')
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [passwordClientError, setPasswordClientError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  useEffect(() => {
    setProfileForm({
      name: sessionUser?.name ?? '',
      email: sessionUser?.email ?? '',
    })
    setAllowProfileEdit(false)
    setProfilePassword('')
    setProfileSuccess(null)
    setPasswordSuccess(null)
    userStore.clearProfileFeedback()
  }, [sessionUser?.name, sessionUser?.email, userStore])

  if (!sessionUser) {
    return (
      <div className={styles.guard}>
        <h1 className={styles.guardTitle}>{t('guard.title')}</h1>
        <p className={styles.guardSubtitle}>{t('guard.subtitle')}</p>
        <div className={styles.guardActions}>
          <Link href="/login" className={classNames(styles.guardButton, styles.guardButtonPrimary)}>
            {t('guard.actions.sign_in')}
          </Link>
        </div>
      </div>
    )
  }

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileSuccess(null)

    if (!allowProfileEdit) {
      return
    }

    const result = await userStore.updateProfile({
      name: profileForm.name,
      email: profileForm.email,
      currentPassword: profilePassword,
    })

    if (result) {
      setProfileSuccess(t('sections.overview.form.success'))
      setAllowProfileEdit(false)
      setProfilePassword('')
    }
  }

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordClientError(null)
    setPasswordSuccess(null)

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordClientError(t('sections.security.form.mismatch'))
      return
    }

    const success = await userStore.changePassword(passwordForm.current, passwordForm.next)
    if (success) {
      setPasswordSuccess(t('sections.security.form.success'))
      setPasswordForm({ current: '', next: '', confirm: '' })
    }
  }

  const handleToggleEditing = () => {
    const next = !allowProfileEdit
    setAllowProfileEdit(next)
    setProfileSuccess(null)
    if (!next) {
      setProfilePassword('')
      userStore.clearProfileFeedback()
      setProfileForm({
        name: sessionUser.name ?? '',
        email: sessionUser.email,
      })
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </header>

      <div className={styles.sections}>
        <section className={classNames('card', styles.card)}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('sections.overview.title')}</h2>
            <p className={styles.sectionDescription}>{t('sections.overview.description')}</p>
          </div>
          <form className={styles.formGrid} onSubmit={handleProfileSubmit}>
            <label>
              <div>{t('sections.overview.form.name_label')}</div>
              <input
                value={profileForm.name}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={t('sections.overview.form.name_placeholder')}
                autoComplete="name"
                disabled={!allowProfileEdit || userStore.profileSaving}
              />
            </label>
            <label>
              <div>{t('sections.overview.form.email_label')}</div>
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder={t('sections.overview.form.email_placeholder')}
                autoComplete="email"
                disabled={!allowProfileEdit || userStore.profileSaving}
              />
            </label>

            <div className={styles.editToggle}>
              <label className={styles.toggleLabel}>
                <input type="checkbox" checked={allowProfileEdit} onChange={handleToggleEditing} />
                <span>{t('sections.overview.form.enable_edit')}</span>
              </label>
            </div>

            {allowProfileEdit ? (
              <label>
                <div>{t('sections.overview.form.password_label')}</div>
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(event) => {
                    setProfilePassword(event.target.value)
                    setProfileSuccess(null)
                  }}
                  placeholder={t('sections.overview.form.password_placeholder')}
                  autoComplete="current-password"
                  disabled={userStore.profileSaving}
                />
              </label>
            ) : null}

            {profileSuccess ? <span className={styles.successMessage}>{profileSuccess}</span> : null}
            {userStore.profileError ? (
              <span className={styles.errorMessage}>{userStore.profileError}</span>
            ) : null}

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={
                  !allowProfileEdit ||
                  userStore.profileSaving ||
                  profilePassword.trim().length === 0
                }
              >
                {userStore.profileSaving
                  ? t('sections.overview.form.submitting')
                  : t('sections.overview.form.submit')}
              </button>
            </div>
          </form>
        </section>

        <section className={classNames('card', styles.card)}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('sections.security.title')}</h2>
            <p className={styles.sectionDescription}>{t('sections.security.description')}</p>
          </div>
          <form className={styles.formGrid} onSubmit={handlePasswordSubmit}>
            <label>
              <div>{t('sections.security.form.current_label')}</div>
              <input
                type="password"
                value={passwordForm.current}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, current: event.target.value }))}
                placeholder={t('sections.security.form.current_placeholder')}
                autoComplete="current-password"
                disabled={userStore.passwordChanging}
              />
            </label>
            <label>
              <div>{t('sections.security.form.new_label')}</div>
              <input
                type="password"
                value={passwordForm.next}
                onChange={(event) => {
                  setPasswordClientError(null)
                  setPasswordForm((prev) => ({ ...prev, next: event.target.value }))
                }}
                placeholder={t('sections.security.form.new_placeholder')}
                autoComplete="new-password"
                disabled={userStore.passwordChanging}
              />
            </label>
            <label>
              <div>{t('sections.security.form.confirm_label')}</div>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(event) => {
                  setPasswordClientError(null)
                  setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))
                }}
                placeholder={t('sections.security.form.confirm_placeholder')}
                autoComplete="new-password"
                disabled={userStore.passwordChanging}
              />
            </label>

            {passwordSuccess ? <span className={styles.successMessage}>{passwordSuccess}</span> : null}
            {passwordClientError ? (
              <span className={styles.errorMessage}>{passwordClientError}</span>
            ) : null}
            {userStore.passwordError ? (
              <span className={styles.errorMessage}>{userStore.passwordError}</span>
            ) : null}

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={userStore.passwordChanging}
              >
                {userStore.passwordChanging
                  ? t('sections.security.form.submitting')
                  : t('sections.security.form.submit')}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
})

export default ProfilePage
