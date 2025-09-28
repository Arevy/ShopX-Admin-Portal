'use client'

import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { DataTable, type Column } from '@/components/DataTable'
import { StatusBadge } from '@/components/StatusBadge'
import { useSupportDesk } from '@/hooks/useSupportDesk'
import { useTranslation } from '@/i18n'
import type { Order } from '@/types/domain'
import styles from './Support.module.scss'

const TRANSLATION_NAMESPACE = 'Page_Admin_Support'

const SupportPage = observer(() => {
  const { userId, setUserId, handleLookup, clearProfile, customer, loading, error } = useSupportDesk()
  const { t } = useTranslation(TRANSLATION_NAMESPACE)

  const orderColumns: Column<Order>[] = [
    { key: 'id', header: t('orders.table.columns.order') },
    {
      key: 'total',
      header: t('orders.table.columns.total'),
      render: (order) => `$${Number(order.total).toFixed(2)}`,
    },
    {
      key: 'status',
      header: t('orders.table.columns.status'),
      render: (order) => <StatusBadge status={String(order.status)} />,
    },
    {
      key: 'createdAt',
      header: t('orders.table.columns.created_at'),
      render: (order) => (order.createdAt ? new Date(String(order.createdAt)).toLocaleString() : '—'),
    },
  ]

  return (
    <div className={styles.container}>
      <section className={classNames('surface-border', styles.panel)}>
        <form onSubmit={handleLookup} className={styles.lookupForm}>
          <div>
            <label className={styles.fieldLabel}>{t('form.fields.customer_id')}</label>
            <input
              placeholder={t('form.placeholders.customer_id')}
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className={styles.lookupInput}
            />
          </div>
          <button type="submit" className={styles.primaryButton}>
            {t('form.actions.load')}
          </button>
          {customer ? (
            <button type="button" onClick={clearProfile} className={styles.secondaryButton}>
              {t('form.actions.clear')}
            </button>
          ) : null}
        </form>
      </section>

      {loading ? <LoadingState label={t('loading.profile')} /> : null}
      {error ? <ErrorState message={error} /> : null}

      {customer?.user ? (
        <section className={classNames('grid', styles.gridLayout)}>
          <div className={classNames('surface-border', styles.identityCard)}>
            <h3 className={styles.sectionHeading}>{t('identity.title')}</h3>
            <div className={styles.identityFacts}>
              <span>
                <strong>{t('identity.labels.id')}:</strong> {customer.user.id}
              </span>
              <span>
                <strong>{t('identity.labels.email')}:</strong> {customer.user.email}
              </span>
              <span>
                <strong>{t('identity.labels.name')}:</strong> {customer.user.name ?? '—'}
              </span>
              <span>
                <strong>{t('identity.labels.role')}:</strong> {customer.user.role}
              </span>
              <span className={classNames('badge', styles.badgeSummary)}>
                {t('identity.summary', {
                  orders: customer.orders.length,
                  reviews: customer.reviews.length,
                })}
              </span>
            </div>
          </div>

          <div className={classNames('surface-border', styles.dataCard)}>
            <h3 className={styles.sectionHeading}>{t('orders.title')}</h3>
            <DataTable
              columns={orderColumns}
              data={customer.orders}
              emptyState={<span>{t('orders.empty')}</span>}
            />
          </div>

          <div className={classNames('grid', styles.columnsGrid)}>
            <div className={classNames('surface-border', styles.dataCard)}>
              <h3 className={styles.sectionHeading}>{t('addresses.title')}</h3>
              {customer.addresses.length ? (
                <ul className={styles.listReset}>
                  {customer.addresses.map((address) => (
                    <li key={address.id} className={classNames('card', styles.addressItem)}>
                      <strong>{address.street}</strong>
                      <br />
                      {address.city}, {address.postalCode}
                      <br />
                      {address.country}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyState}>{t('addresses.empty')}</p>
              )}
            </div>

            <div className={classNames('surface-border', styles.dataCard)}>
              <h3 className={styles.sectionHeading}>{t('wishlist.title')}</h3>
              {customer.wishlist?.products.length ? (
                <ul className={styles.badgeList}>
                  {customer.wishlist.products.map((product) => (
                    <li key={product.id} className={classNames('badge', styles.badgePill)}>
                      {product.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyState}>{t('wishlist.empty')}</p>
              )}
            </div>

            <div className={classNames('surface-border', styles.dataCard)}>
              <h3 className={styles.sectionHeading}>{t('cart.title')}</h3>
              {customer.cart ? (
                <ul className={styles.listReset}>
                  {customer.cart.items.map((item, index) => (
                    <li key={`${item.product.id}-${index}`} className={classNames('card', styles.cartItem)}>
                      <div className={styles.cartItemContent}>
                        <span>{item.product.name}</span>
                        <span>
                          {item.quantity} × ${Number(item.product.price).toFixed(2)}
                        </span>
                      </div>
                    </li>
                  ))}
                  <li className={classNames('badge', styles.cartTotal)}>
                    {t('cart.total', { total: customer.cart.total.toFixed(2) })}
                  </li>
                </ul>
              ) : (
                <p className={styles.emptyState}>{t('cart.empty')}</p>
              )}
            </div>

            <div className={classNames('surface-border', styles.dataCard)}>
              <h3 className={styles.sectionHeading}>{t('reviews.title')}</h3>
              {customer.reviews.length ? (
                <ul className={styles.listReset}>
                  {customer.reviews.map((review) => (
                    <li key={review.id} className={classNames('card', styles.reviewItem)}>
                      <strong>{t('reviews.product_label', { id: review.productId })}</strong>
                      <div className={styles.reviewMeta}>
                        {t('reviews.rating', { rating: review.rating })}
                      </div>
                      <p className={styles.reviewText}>
                        {review.reviewText ?? t('reviews.no_text')}
                      </p>
                      <span className={styles.reviewTimestamp}>
                        {new Date(review.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyState}>{t('reviews.empty')}</p>
              )}
            </div>
          </div>
        </section>
      ) : customer ? (
        <ErrorState message={t('errors.not_found')} />
      ) : null}
    </div>
  )
})

export default SupportPage
