'use client'

import { observer } from 'mobx-react-lite'
import { DataTable, type Column } from '@/components/DataTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { StatusBadge } from '@/components/StatusBadge'
import { useOrders } from '@/hooks/useOrders'
import { Order } from '@/types/domain'
import classNames from 'classnames'
import styles from './Orders.module.scss'

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

  if (loading) {
    return <LoadingState label="Syncing orders…" />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  const orderColumns: Column<Order>[] = [
    { key: 'id', header: 'Order' },
    { key: 'userId', header: 'Customer' },
    {
      key: 'total',
      header: 'Total',
      render: (order) => `$${Number(order.total).toFixed(2)}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => <StatusBadge status={String(order.status)} />,
    },
    {
      key: 'createdAt',
      header: 'Created at',
      render: (order) =>
        order.createdAt ? new Date(String(order.createdAt)).toLocaleString() : '—',
    },
    {
      key: 'actions',
      header: 'Update status',
      render: (order) => (
        <select
          className={styles.statusDropdown}
          defaultValue={String(order.status)}
          onChange={(event) => handleStatusChange(String(order.id), event.target.value)}
          disabled={pending[String(order.id)]}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <section className={classNames('surface-border', styles.panel)}>
        <form onSubmit={handleFilter} className={styles.filterForm}>
          <div>
            <label className={styles.fieldLabel}>Status</label>
            <select
              className={styles.statusSelect}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.fieldLabel}>Customer ID</label>
            <input
              placeholder="Numeric user ID"
              value={userIdFilter}
              onChange={(event) => setUserIdFilter(event.target.value)}
              className={styles.idInput}
            />
          </div>
          <button type="submit" className={styles.primaryButton}>
            Apply filters
          </button>
        </form>

        {(activeFilters.status || activeFilters.userId) && (
          <p className={styles.filterSummary}>
            Active filters:
            {activeFilters.status ? ` status = ${activeFilters.status}` : ''}
            {activeFilters.userId
              ? `${activeFilters.status ? ',' : ''} customer ID = ${activeFilters.userId}`
              : ''}
          </p>
        )}

        <DataTable<Order>
          columns={orderColumns}
          data={orders}
          emptyState={<span>No orders yet. Adjust your filter or sync backend.</span>}
        />
        {feedback ? (
          <span
            className={feedback.includes('updated') ? styles.feedbackPositive : styles.feedbackNegative}
          >
            {feedback}
          </span>
        ) : null}
      </section>
    </div>
  )
})

export default OrdersPage
