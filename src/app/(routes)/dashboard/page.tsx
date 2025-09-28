'use client'

import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { MetricCard } from '@/components/MetricCard'
import { DataTable } from '@/components/DataTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { StatusBadge } from '@/components/StatusBadge'
import { useDashboard } from '@/hooks/useDashboard'
import { useTranslation } from '@/i18n'
import styles from './Dashboard.module.scss'

const TRANSLATION_NAMESPACE = 'Page_Admin_Dashboard'

const DashboardPage = observer(() => {
  const { metrics, recentOrders, topCustomers, loading, error } = useDashboard()
  const { t } = useTranslation(TRANSLATION_NAMESPACE)

  if (loading) {
    return <LoadingState label={t('loading.metrics')} />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  return (
    <div className={styles.container}>
      <section className="grid grid-columns-3">
        <MetricCard
          label={t('metrics.revenue.label')}
          value={metrics ? `$${metrics.totalRevenue.toFixed(2)}` : '—'}
          delta={t('metrics.revenue.delta')}
          tone="accent"
        />
        <MetricCard
          label={t('metrics.orders.label')}
          value={metrics ? metrics.orders.toString() : '—'}
          delta={t('metrics.orders.delta')}
          tone="success"
        />
        <MetricCard
          label={t('metrics.products.label')}
          value={metrics ? metrics.products.toString() : '—'}
          delta={t('metrics.products.delta')}
          tone="warning"
        />
        <MetricCard
          label={t('metrics.customers.label')}
          value={metrics ? metrics.customers.toString() : '—'}
          tone="neutral"
        />
        <MetricCard
          label={t('metrics.rating.label')}
          value={metrics?.averageRating ? metrics.averageRating.toFixed(2) : 'N/A'}
          tone="accent"
        />
      </section>

      <section className={classNames('grid', styles.activityGrid)}>
        <div>
          <h3 className={styles.sectionTitle}>{t('sections.latest_orders.title')}</h3>
          <DataTable
            columns={[
              { key: 'id', header: t('sections.latest_orders.table.columns.order') },
              {
                key: 'total',
                header: t('sections.latest_orders.table.columns.total'),
                render: (order) => `$${(order.total as number).toFixed(2)}`,
              },
              { key: 'userId', header: t('sections.latest_orders.table.columns.customer') },
              {
                key: 'status',
                header: t('sections.latest_orders.table.columns.status'),
                render: (order) => <StatusBadge status={String(order.status)} />,
              },
              {
                key: 'createdAt',
                header: t('sections.latest_orders.table.columns.created_at'),
                render: (order) =>
                  order.createdAt
                    ? new Date(String(order.createdAt)).toLocaleString()
                    : '—',
              },
            ]}
            data={recentOrders}
            emptyState={<span>{t('sections.latest_orders.table.empty')}</span>}
          />
        </div>
        <div>
          <h3 className={styles.sectionTitle}>{t('sections.top_customers.title')}</h3>
          <div className={classNames('surface-border', styles.topCustomersCard)}>
            {topCustomers.length === 0 ? (
              <span className={styles.topCustomersPlaceholder}>{t('sections.top_customers.placeholder')}</span>
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
