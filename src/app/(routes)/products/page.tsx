'use client'

import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import classNames from 'classnames'
import { DataTable, type Column } from '@/components/DataTable'
import { ModularImage } from '@/components/ModularImage'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useProducts } from '@/hooks/useProducts'
import { useTranslation } from '@/i18n'
import { Product } from '@/types/domain'
import styles from './Products.module.scss'

const TRANSLATION_NAMESPACE = 'Page_Admin_Products'

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
    handleCreateImageChange,
    creating,
    editForm,
    setEditForm,
    beginEdit,
    resetEdit,
    handleUpdate,
    handleEditImageChange,
    handleEditRemoveImageToggle,
    updating,
    handleDelete,
    feedback,
  } = useProducts()
  const { t } = useTranslation(TRANSLATION_NAMESPACE)

  const requestDelete = (productId: string) => {
    if (!confirm(t('dialogs.confirm_delete'))) {
      return
    }

    void handleDelete(productId)
  }

  const activeFilterChips = useMemo(() => {
    const chips: string[] = []
    if (activeFilters.name) {
      chips.push(t('filters.summary.name', { value: activeFilters.name }))
    }
    if (activeFilters.categoryId) {
      chips.push(t('filters.summary.category', { value: activeFilters.categoryId }))
    }
    return chips
  }, [activeFilters.categoryId, activeFilters.name, t])

  if (loading && products.length === 0) {
    return <LoadingState label={t('loading.catalog')} />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  const productColumns: Column<Product>[] = [
    { key: 'id', header: t('table.columns.id') },
    {
      key: 'image',
      header: t('table.columns.image'),
      render: (product) =>
        product.image ? (
          <ModularImage
            src={product.image.url}
            alt={product.image.filename ?? product.name}
            width={48}
            height={48}
            sizes="48px"
            className={styles.thumbnail}
          />
        ) : (
          <span className={styles.emptyImage}>{t('table.cells.no_image')}</span>
        ),
    },
    { key: 'name', header: t('table.columns.name') },
    {
      key: 'price',
      header: t('table.columns.price'),
      render: (product) => `$${Number(product.price).toFixed(2)}`,
    },
    {
      key: 'category',
      header: t('table.columns.category'),
      render: (product) => product.category?.name ?? t('table.cells.uncategorised'),
    },
    {
      key: 'actions',
      header: t('table.columns.actions'),
      render: (product) => (
        <div className={styles.actionButtons}>
          <button
            type="button"
            onClick={() => beginEdit(product)}
            className={styles.editButton}
          >
            {t('table.actions.edit')}
          </button>
          <button
            type="button"
            onClick={() => requestDelete(String(product.id))}
            className={styles.dangerButton}
          >
            {t('table.actions.remove')}
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
            <label className={styles.fieldLabel}>{t('filters.fields.name.label')}</label>
            <input
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder={t('filters.fields.name.placeholder')}
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>{t('filters.fields.category.label')}</label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">{t('filters.fields.category.any')}</option>
              {categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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

        <DataTable<Product>
          columns={productColumns}
          data={products}
          emptyState={<span>{t('table.empty')}</span>}
        />
      </section>

      <section className={classNames('surface-border', styles.panel)}>
        <div>
          <h3 className={styles.sectionHeading}>{t('create.heading')}</h3>
          <p className={styles.sectionSubheading}>{t('create.subheading')}</p>
        </div>
        <form onSubmit={handleCreate} className={styles.formGrid}>
          <div>
            <label className={styles.fieldLabel}>{t('form.fields.name')}</label>
            <input
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className={styles.fieldLabel}>{t('form.fields.price')}</label>
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
            <label className={styles.fieldLabel}>{t('form.fields.category')}</label>
            <select
              value={createForm.categoryId}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, categoryId: event.target.value }))
              }
              required
            >
              <option value="">{t('form.fields.category_placeholder')}</option>
              {categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.wideField}>
            <label className={styles.fieldLabel}>{t('form.fields.description')}</label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>
          <div className={styles.wideField}>
            <label className={styles.fieldLabel}>{t('form.fields.image')}</label>
            <div className={styles.imageField}>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  void handleCreateImageChange(event.target.files?.[0] ?? null)
                }
              />
              {createForm.imageBase64 ? (
                <ModularImage
                  src={createForm.imageBase64}
                  alt={t('form.image.preview_alt')}
                  width={82}
                  height={82}
                  sizes="82px"
                  className={styles.previewImage}
                />
              ) : (
                <span className={styles.emptyImage}>{t('form.image.empty')}</span>
              )}
            </div>
          </div>
          <div className={styles.formFooter}>
            <button type="submit" disabled={creating} className={styles.primaryButton}>
              {creating ? t('create.actions.pending') : t('create.actions.submit')}
            </button>
          </div>
        </form>
      </section>

      {editForm.id ? (
        <section className={classNames('surface-border', styles.panel)}>
          <div>
            <h3 className={styles.sectionHeading}>{t('edit.heading')}</h3>
            <p className={styles.sectionSubheading}>
              {t('edit.subheading', { id: editForm.id })}
            </p>
          </div>
          <form onSubmit={handleUpdate} className={styles.formGrid}>
            <div>
              <label className={styles.fieldLabel}>{t('form.fields.name')}</label>
              <input
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>{t('form.fields.price')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editForm.price}
                onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))}
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>{t('form.fields.category')}</label>
              <select
                value={editForm.categoryId}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, categoryId: event.target.value }))
                }
              >
                <option value="">{t('edit.fields.category.unassigned')}</option>
                {categories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.wideField}>
              <label className={styles.fieldLabel}>{t('form.fields.description')}</label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
            <div className={styles.wideField}>
              <label className={styles.fieldLabel}>{t('form.fields.image')}</label>
              <div className={styles.imageField}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={editForm.removeImage}
                  onChange={(event) =>
                    void handleEditImageChange(event.target.files?.[0] ?? null)
                  }
                />
                {editForm.imageBase64 ? (
                  <ModularImage
                    src={editForm.imageBase64}
                    alt={t('form.image.preview_alt')}
                    width={82}
                    height={82}
                    sizes="82px"
                    className={styles.previewImage}
                  />
                ) : editForm.existingImageUrl && !editForm.removeImage ? (
                  <ModularImage
                    src={editForm.existingImageUrl}
                    alt={editForm.existingImageFilename ?? t('edit.image.current_alt')}
                    width={82}
                    height={82}
                    sizes="82px"
                    className={styles.previewImage}
                  />
                ) : (
                  <span className={styles.emptyImage}>{t('edit.image.absent')}</span>
                )}
              </div>
              {(editForm.existingImageUrl || editForm.removeImage) && (
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={editForm.removeImage}
                    onChange={(event) => handleEditRemoveImageToggle(event.target.checked)}
                    disabled={Boolean(editForm.imageBase64)}
                  />
                  {t('edit.image.remove_toggle')}
                </label>
              )}
            </div>
            <div className={styles.editActions}>
              <button type="submit" disabled={updating} className={styles.primaryButton}>
                {updating ? t('edit.actions.pending') : t('edit.actions.submit')}
              </button>
              <button type="button" onClick={resetEdit} className={styles.secondaryButton}>
                {t('edit.actions.cancel')}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {feedback ? (
        <span className={feedback.tone === 'negative' ? styles.feedbackNegative : styles.feedbackPositive}>
          {feedback.message}
        </span>
      ) : null}
    </div>
  )
})

export default ProductsPage
