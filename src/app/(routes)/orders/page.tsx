'use client'

import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { DataTable, type Column } from '@/components/DataTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { StatusBadge } from '@/components/StatusBadge'
import { useOrders } from '@/hooks/useOrders'
import { useTranslation } from '@/i18n'
import { Order } from '@/types/domain'
import styles from './Orders.module.scss'

const TRANSLATION_NAMESPACE = 'Page_Admin_Orders'

const OrdersPage = observer(() => {
  const {
    orders,
    loading,
    error,
    activeFilters,
    statusOptions,
    statusFilter,
    setStatusFilter,
    userIdFilter,
    setUserIdFilter,
    handleFilter,
    handleStatusChange,
    pending,
    feedback,
  } = useOrders()
  const { t } = useTranslation(TRANSLATION_NAMESPACE)

  if (loading) {
    return <LoadingState label={t('loading.sync')} />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  const orderColumns: Column<Order>[] = [
    { key: 'id', header: t('table.columns.order') },
    { key: 'userId', header: t('table.columns.customer') },
    {
      key: 'total',
      header: t('table.columns.total'),
      render: (order) => `$${Number(order.total).toFixed(2)}`,
    },
    {
      key: 'status',
      header: t('table.columns.status'),
      render: (order) => <StatusBadge status={String(order.status)} />,
    },
    {
      key: 'createdAt',
      header: t('table.columns.created_at'),
      render: (order) =>
        order.createdAt ? new Date(String(order.createdAt)).toLocaleString() : '—',
    },
    {
      key: 'actions',
      header: t('table.columns.update_status'),
      render: (order) => (
        <select
          className={styles.statusDropdown}
          defaultValue={String(order.status)}
          onChange={(event) => handleStatusChange(String(order.id), event.target.value)}
          disabled={pending[String(order.id)]}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {t(`statuses.${status.toLowerCase()}`)}
            </option>
          ))}
        </select>
      ),
    },
  ]

  const activeFilterChips: string[] = []
  if (activeFilters.status) {
    activeFilterChips.push(t('filters.summary.status', { value: activeFilters.status }))
  }
  if (activeFilters.userId) {
    activeFilterChips.push(t('filters.summary.user', { value: activeFilters.userId }))
  }

  return (
    <div className={styles.container}>
      <section className={classNames('surface-border', styles.panel)}>
        <form onSubmit={handleFilter} className={styles.filterForm}>
          <div>
            <label className={styles.fieldLabel}>{t('filters.fields.status.label')}</label>
            <select
              className={styles.statusSelect}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">{t('filters.fields.status.any')}</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {t(`statuses.${status.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.fieldLabel}>{t('filters.fields.user.label')}</label>
            <input
              placeholder={t('filters.fields.user.placeholder')}
              value={userIdFilter}
              onChange={(event) => setUserIdFilter(event.target.value)}
              className={styles.idInput}
            />
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

        <DataTable<Order>
          columns={orderColumns}
          data={orders}
          emptyState={<span>{t('table.empty')}</span>}
        />
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

export default OrdersPage
