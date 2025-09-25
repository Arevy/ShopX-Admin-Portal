'use client'

import { observer } from 'mobx-react-lite'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { DataTable } from '@/components/DataTable'
import { StatusBadge } from '@/components/StatusBadge'
import { useSupportDesk } from '@/hooks/useSupportDesk'
import classNames from 'classnames'
import styles from './Support.module.scss'

const SupportPage = observer(() => {
  const { userId, setUserId, handleLookup, clearProfile, customer, loading, error } = useSupportDesk()

  return (
    <div className={styles.container}>
      <section className={classNames('surface-border', styles.panel)}>
        <form onSubmit={handleLookup} className={styles.lookupForm}>
          <div>
            <label className={styles.fieldLabel}>Customer ID</label>
            <input
              placeholder="uuid"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className={styles.lookupInput}
            />
          </div>
          <button type="submit" className={styles.primaryButton}>
            Load profile
          </button>
          {customer ? (
            <button type="button" onClick={clearProfile} className={styles.secondaryButton}>
              Clear
            </button>
          ) : null}
        </form>
      </section>

      {loading ? <LoadingState label="Retrieving customer context…" /> : null}
      {error ? <ErrorState message={error} /> : null}

      {customer?.user ? (
        <section className={classNames('grid', styles.gridLayout)}>
          <div className={classNames('surface-border', styles.identityCard)}>
            <h3 className={styles.sectionHeading}>Identity snapshot</h3>
            <div className={styles.identityFacts}>
              <span>
                <strong>ID:</strong> {customer.user.id}
              </span>
              <span>
                <strong>Email:</strong> {customer.user.email}
              </span>
              <span>
                <strong>Name:</strong> {customer.user.name ?? '—'}
              </span>
              <span>
                <strong>Role:</strong> {customer.user.role}
              </span>
              <span className={classNames('badge', styles.badgeSummary)}>
                Orders: {customer.orders.length} · Reviews: {customer.reviews.length}
              </span>
            </div>
          </div>

          <div className={classNames('surface-border', styles.dataCard)}>
            <h3 className={styles.sectionHeading}>Recent orders</h3>
            <DataTable
              columns={[
                { key: 'id', header: 'Order' },
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
                  header: 'Placed at',
                  render: (order) =>
                    order.createdAt ? new Date(String(order.createdAt)).toLocaleString() : '—',
                },
              ]}
              data={customer.orders}
              emptyState={<span>No orders yet.</span>}
            />
          </div>

          <div className={classNames('grid', styles.columnsGrid)}>
            <div className={classNames('surface-border', styles.dataCard)}>
              <h3 className={styles.sectionHeading}>Addresses</h3>
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
                <p className={styles.emptyState}>No addresses tracked.</p>
              )}
            </div>

            <div className={classNames('surface-border', styles.dataCard)}>
              <h3 className={styles.sectionHeading}>Wishlist</h3>
              {customer.wishlist?.products.length ? (
                <ul className={styles.badgeList}>
                  {customer.wishlist.products.map((product) => (
                    <li key={product.id} className={classNames('badge', styles.badgePill)}>
                      {product.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyState}>Wishlist empty.</p>
              )}
            </div>

            <div className={classNames('surface-border', styles.dataCard)}>
              <h3 className={styles.sectionHeading}>Active cart</h3>
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
                    Cart total: ${customer.cart.total.toFixed(2)}
                  </li>
                </ul>
              ) : (
                <p className={styles.emptyState}>Cart is empty.</p>
              )}
            </div>

            <div className={classNames('surface-border', styles.dataCard)}>
              <h3 className={styles.sectionHeading}>Reviews</h3>
              {customer.reviews.length ? (
                <ul className={styles.listReset}>
                  {customer.reviews.map((review) => (
                    <li key={review.id} className={classNames('card', styles.reviewItem)}>
                      <strong>Product {review.productId}</strong>
                      <div className={styles.reviewMeta}>Rating {review.rating} / 5</div>
                      <p className={styles.reviewText}>{review.reviewText ?? 'No review text.'}</p>
                      <span className={styles.reviewTimestamp}>
                        {new Date(review.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyState}>No reviews submitted.</p>
              )}
            </div>
          </div>
        </section>
      ) : customer ? (
        <ErrorState message="Customer not found." />
      ) : null}
    </div>
  )
})

export default SupportPage
