'use client'

import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { MetricCard } from '@/components/MetricCard'
import { DataTable } from '@/components/DataTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { StatusBadge } from '@/components/StatusBadge'
import { useDashboard } from '@/hooks/useDashboard'
import styles from './Dashboard.module.scss'

const DashboardPage = observer(() => {
  const { metrics, recentOrders, topCustomers, loading, error } = useDashboard()

  if (loading) {
    return <LoadingState label="Breathing in metrics…" />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  return (
    <div className={styles.container}>
      <section className="grid grid-columns-3">
        <MetricCard
          label="Net revenue (period)"
          value={metrics ? `$${metrics.totalRevenue.toFixed(2)}` : '—'}
          delta="+4.5% vs. last cycle"
          tone="accent"
        />
        <MetricCard
          label="Orders processed"
          value={metrics ? metrics.orders.toString() : '—'}
          delta="97% SLA hit"
          tone="success"
        />
        <MetricCard
          label="Products live"
          value={metrics ? metrics.products.toString() : '—'}
          delta="12 awaiting approval"
          tone="warning"
        />
        <MetricCard
          label="Active customers"
          value={metrics ? metrics.customers.toString() : '—'}
          tone="neutral"
        />
        <MetricCard
          label="Avg. product rating"
          value={metrics?.averageRating ? metrics.averageRating.toFixed(2) : 'N/A'}
          tone="accent"
        />
      </section>

      <section className={classNames('grid', styles.activityGrid)}>
        <div>
          <h3 className={styles.sectionTitle}>Latest orders</h3>
          <DataTable
            columns={[
              { key: 'id', header: 'Order' },
              {
                key: 'total',
                header: 'Total',
                render: (order) => `$${(order.total as number).toFixed(2)}`,
              },
              { key: 'userId', header: 'Customer' },
              {
                key: 'status',
                header: 'Status',
                render: (order) => <StatusBadge status={String(order.status)} />,
              },
              {
                key: 'createdAt',
                header: 'Created at',
                render: (order) =>
                  order.createdAt
                    ? new Date(String(order.createdAt)).toLocaleString()
                    : '—',
              },
            ]}
            data={recentOrders}
            emptyState={<span>No orders pulled yet.</span>}
          />
        </div>
        <div>
          <h3 className={styles.sectionTitle}>Top customer inbox</h3>
          <div className={classNames('surface-border', styles.topCustomersCard)}>
            {topCustomers.length === 0 ? (
              <span className={styles.topCustomersPlaceholder}>No customers found.</span>
            ) : (
              <ul className={styles.topCustomersList}>
                {topCustomers.map((customer) => (
                  <li key={customer.id} className={styles.topCustomersItem}>
                    <div>
                      <div className={styles.customerName}>{customer.name ?? customer.email}</div>
                      <div className={styles.customerEmail}>{customer.email}</div>
                    </div>
                    <span className={classNames('badge', styles.customerRole)}>{customer.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
})

export default DashboardPage
