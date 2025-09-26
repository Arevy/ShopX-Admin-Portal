'use client'

import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { DataTable, type Column } from '@/components/DataTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useUsers } from '@/hooks/useUsers'
import { User, UserRole } from '@/types/domain'
import styles from './Users.module.scss'

const UsersPage = observer(() => {
  const {
    users,
    loading,
    error,
    handleSearch,
    handleCreate,
    activeFilters,
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
  } = useUsers()

  if (loading) {
    return <LoadingState label="Warming up user directory…" />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  const userColumns: Column<User>[] = [
    { key: 'id', header: 'ID' },
    { key: 'email', header: 'Email' },
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role' },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className={styles.actionGroup}>
          <button
            type="button"
            className={classNames('badge', styles.actionButton)}
            onClick={() => handleImpersonate(user.id)}
          >
            Impersonate
          </button>
          <button
            type="button"
            className={classNames('badge', styles.dangerButton)}
            onClick={() => handleForceLogout(user.id)}
          >
            Force logout
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <section className={classNames('surface-border', styles.panel)}>
        <form onSubmit={handleSearch} className={styles.filterForm}>
          <div className={styles.filterField}>
            <label className={styles.fieldLabel}>Email contains</label>
            <input
              value={emailSearch}
              onChange={(event) => setEmailSearch(event.target.value)}
              placeholder="customer@shopx.dev"
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Role</label>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as UserRole | '')}
            >
              <option value="">Any role</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={styles.primaryButton}>
            Filter
          </button>
        </form>

        {(activeFilters.email || activeFilters.role) && (
          <p className={styles.filterSummary}>
            Active filters:
            {activeFilters.email ? ` email contains "${activeFilters.email}"` : ''}
            {activeFilters.role
              ? `${activeFilters.email ? ',' : ''} role = ${activeFilters.role}`
              : ''}
          </p>
        )}

        <DataTable<User>
          columns={userColumns}
          data={users}
          emptyState={<span>No users match the current filter.</span>}
        />
      </section>

      <section className={classNames('surface-border', styles.panel)}>
        <header>
          <h3 className={styles.sectionHeading}>Invite support teammate</h3>
          <p className={styles.sectionSubheading}>
            Create support or customer accounts directly in the operational GraphQL backend.
          </p>
        </header>
        <form onSubmit={handleCreate} className={styles.formGrid}>
          <div>
            <label className={styles.fieldLabel}>Email</label>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Name</label>
            <input
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Temporary password</label>
            <input
              value={formState.password}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Role</label>
            <select
              value={formState.role}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, role: event.target.value as UserRole }))
              }
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formAction}>
            <button type="submit" disabled={creating} className={classNames(styles.primaryButton, styles.fullWidth)}>
              {creating ? 'Provisioning…' : 'Create user'}
            </button>
          </div>
        </form>
        {feedback ? (
          <span
            className={feedback.startsWith('User') ? styles.feedbackPositive : styles.feedbackNegative}
          >
            {feedback}
          </span>
        ) : null}
      </section>
    </div>
  )
})

export default UsersPage
