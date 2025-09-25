'use client'

import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { DataTable, type Column } from '@/components/DataTable'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useProducts } from '@/hooks/useProducts'
import { Product } from '@/types/domain'
import styles from './Products.module.scss'

const ProductsPage = observer(() => {
  const {
    products,
    categories,
    loading,
    error,
    activeFilters,
    nameFilter,
    setNameFilter,
    categoryFilter,
    setCategoryFilter,
    handleFilter,
    createForm,
    setCreateForm,
    handleCreate,
    creating,
    editForm,
    setEditForm,
    beginEdit,
    resetEdit,
    handleUpdate,
    updating,
    handleDelete,
    feedback,
  } = useProducts()

  const requestDelete = (productId: string) => {
    if (!confirm('This will remove the product. Continue?')) {
      return
    }

    void handleDelete(productId)
  }

  if (loading && products.length === 0) {
    return <LoadingState label="Loading catalog…" />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  const productColumns: Column<Product>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    {
      key: 'price',
      header: 'Price',
      render: (product) => `$${Number(product.price).toFixed(2)}`,
    },
    {
      key: 'category',
      header: 'Category',
      render: (product) => product.category?.name ?? 'Uncategorised',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (product) => (
        <div className={styles.actionButtons}>
          <button
            type="button"
            onClick={() => beginEdit(product)}
            className={styles.editButton}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => requestDelete(String(product.id))}
            className={styles.dangerButton}
          >
            Remove
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className={styles.container}>
      <section className={classNames('surface-border', styles.panel)}>
        <form onSubmit={handleFilter} className={styles.filterForm}>
          <div>
            <label className={styles.fieldLabel}>Name contains</label>
            <input
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="Sneakers"
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Category</label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={styles.primaryButton}>
            Filter products
          </button>
        </form>

        {(activeFilters.name || activeFilters.categoryId) && (
          <p className={styles.filterSummary}>
            Active filters:
            {activeFilters.name ? ` name contains "${activeFilters.name}"` : ''}
            {activeFilters.categoryId
              ? `${activeFilters.name ? ',' : ''} category #${activeFilters.categoryId}`
              : ''}
          </p>
        )}

        <DataTable<Product>
          columns={productColumns}
          data={products}
          emptyState={<span>No products matched the current filters.</span>}
        />
      </section>

      <section className={classNames('surface-border', styles.panel)}>
        <div>
          <h3 className={styles.sectionHeading}>Create product</h3>
          <p className={styles.sectionSubheading}>
            Draft new items straight into the GraphQL layer. All fields are mandatory except description.
          </p>
        </div>
        <form onSubmit={handleCreate} className={styles.formGrid}>
          <div>
            <label className={styles.fieldLabel}>Name</label>
            <input
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={createForm.price}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, price: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>Category</label>
            <select
              value={createForm.categoryId}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, categoryId: event.target.value }))
              }
              required
            >
              <option value="">Select category</option>
              {categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.wideField}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>
          <div className={styles.formFooter}>
            <button type="submit" disabled={creating} className={styles.primaryButton}>
              {creating ? 'Saving…' : 'Create product'}
            </button>
          </div>
        </form>
      </section>

      {editForm.id ? (
        <section className={classNames('surface-border', styles.panel)}>
          <div>
            <h3 className={styles.sectionHeading}>Update product</h3>
            <p className={styles.sectionSubheading}>
              Editing product <code>{editForm.id}</code>
            </p>
          </div>
          <form onSubmit={handleUpdate} className={styles.formGrid}>
            <div>
              <label className={styles.fieldLabel}>Name</label>
              <input
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editForm.price}
                onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))}
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>Category</label>
              <select
                value={editForm.categoryId}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, categoryId: event.target.value }))
                }
              >
                <option value="">Unassigned</option>
                {categories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.wideField}>
              <label className={styles.fieldLabel}>Description</label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
            <div className={styles.editActions}>
              <button type="submit" disabled={updating} className={styles.primaryButton}>
                {updating ? 'Updating…' : 'Save changes'}
              </button>
              <button type="button" onClick={resetEdit} className={styles.secondaryButton}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {feedback ? (
        <span className={feedback.includes('failed') ? styles.feedbackNegative : styles.feedbackPositive}>
          {feedback}
        </span>
      ) : null}
    </div>
  )
})

export default ProductsPage
