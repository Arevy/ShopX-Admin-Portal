'use client'

import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { DataTable, type Column } from '@/components/DataTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useUsers } from '@/hooks/useUsers'
import { useTranslation } from '@/i18n'
import { User, UserRole } from '@/types/domain'
import styles from './Users.module.scss'

const TRANSLATION_NAMESPACE = 'Page_Admin_Users'

const UsersPage = observer(() => {
  const {
    users,
    loading,
    error,
    handleSearch,
    handleCreate,
    emailSearch,
    setEmailSearch,
    roleFilter,
    setRoleFilter,
    formState,
    setFormState,
    creating,
    feedback,
    roleOptions,
    handleForceLogout,
    handleImpersonate,
    activeFilters,
  } = useUsers()
  const { t } = useTranslation(TRANSLATION_NAMESPACE)

  if (loading) {
    return <LoadingState label={t('loading.directory')} />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  const resolveRoleLabel = (role: string) => t(`roles.labels.${role.toLowerCase()}`)

  const userColumns: Column<User>[] = [
    { key: 'id', header: t('table.columns.id') },
    { key: 'email', header: t('table.columns.email') },
    { key: 'name', header: t('table.columns.name') },
    {
      key: 'role',
      header: t('table.columns.role'),
      render: (user) => resolveRoleLabel(String(user.role).toLowerCase()),
    },
    {
      key: 'actions',
      header: t('table.columns.actions'),
      render: (user) => (
        <div className={styles.actionGroup}>
          <button
            type="button"
            className={classNames('badge', styles.actionButton)}
            onClick={() => handleImpersonate(user.id)}
          >
            {t('table.actions.impersonate')}
          </button>
          <button
            type="button"
            className={classNames('badge', styles.dangerButton)}
            onClick={() => handleForceLogout(user.id)}
          >
            {t('table.actions.force_logout')}
          </button>
        </div>
      ),
    },
  ]

  const activeFilterChips: string[] = []
  if (activeFilters.email) {
    activeFilterChips.push(t('filters.summary.email', { value: activeFilters.email }))
  }
  if (activeFilters.role) {
    activeFilterChips.push(t('filters.summary.role', { value: resolveRoleLabel(activeFilters.role.toLowerCase()) }))
  }

  return (
    <div className={styles.container}>
      <section className={classNames('surface-border', styles.panel)}>
        <form onSubmit={handleSearch} className={styles.filterForm}>
          <div className={styles.filterField}>
            <label className={styles.fieldLabel}>{t('filters.fields.email.label')}</label>
            <input
              value={emailSearch}
              onChange={(event) => setEmailSearch(event.target.value)}
              placeholder={t('filters.fields.email.placeholder')}
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>{t('filters.fields.role.label')}</label>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as UserRole | '')}
            >
              <option value="">{t('filters.fields.role.any')}</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {resolveRoleLabel(role.toLowerCase())}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={styles.primaryButton}>
            {t('filters.actions.apply')}
          </button>
        </form>

        {activeFilterChips.length > 0 ? (
          <p className={styles.filterSummary}>
            {t('filters.summary.label')}{' '}
            {activeFilterChips.join(t('filters.summary.separator'))}
          </p>
        ) : null}

        <DataTable<User>
          columns={userColumns}
          data={users}
          emptyState={<span>{t('table.empty')}</span>}
        />
      </section>

      <section className={classNames('surface-border', styles.panel)}>
        <header>
          <h3 className={styles.sectionHeading}>{t('create.heading')}</h3>
          <p className={styles.sectionSubheading}>{t('create.subheading')}</p>
        </header>
        <form onSubmit={handleCreate} className={styles.formGrid}>
          <div>
            <label className={styles.fieldLabel}>{t('form.fields.email')}</label>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>{t('form.fields.name')}</label>
            <input
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>{t('form.fields.password')}</label>
            <input
              value={formState.password}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>{t('form.fields.role')}</label>
            <select
              value={formState.role}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, role: event.target.value as UserRole }))
              }
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {resolveRoleLabel(role.toLowerCase())}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formAction}>
            <button type="submit" disabled={creating} className={classNames(styles.primaryButton, styles.fullWidth)}>
              {creating ? t('create.actions.pending') : t('create.actions.submit')}
            </button>
          </div>
        </form>
        {feedback ? (
          <span
            className={feedback.tone === 'positive' ? styles.feedbackPositive : styles.feedbackNegative}
          >
            {feedback.message}
          </span>
        ) : null}
      </section>
    </div>
  )
})

export default UsersPage
