'use client'

import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { ModularImage } from '@/components/ModularImage'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useStores } from '@/hooks/useStores'
import { useTranslation } from '@/i18n'
import { getStorefrontUrl } from '@/config/env'
import { getUserFriendlyMessage } from '@/lib/getUserFriendlyMessage'
import styles from './ProductDetailPage.module.scss'
import { TRANSLATION_NAMESPACE } from './Route'

interface ImageState {
  file: File | null
  base64: string | null
  remove: boolean
}

type Feedback = {
  tone: 'positive' | 'negative'
  message: string
} | null

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Unexpected file reader result.'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })

const ProductDetailPage = observer(() => {
  const router = useRouter()
  const rawId = router.query.id
  const productId = Array.isArray(rawId) ? rawId[0] : rawId

  const { productStore } = useStores()
  const { t } = useTranslation(TRANSLATION_NAMESPACE)
  const { t: tProducts } = useTranslation('Page_Admin_Products')

  const product = productStore.selectedProduct
  const categories = productStore.categoryOptions

  const [formState, setFormState] = useState({
    name: '',
    price: '',
    description: '',
    categoryId: '',
  })
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    base64: null,
    remove: false,
  })
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [deleteFeedback, setDeleteFeedback] = useState<Feedback>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!router.isReady || !productId) {
      return
    }

    productStore.resetSelectedProduct()
    void productStore.loadProduct(productId)

    return () => {
      productStore.resetSelectedProduct()
    }
  }, [router.isReady, productId, productStore])

  useEffect(() => {
    if (!product) {
      return
    }

    setFormState({
      name: product.name,
      price: product.price.toString(),
      description: product.description ?? '',
      categoryId: product.categoryId ?? '',
    })
    setImageState({
      file: null,
      base64: null,
      remove: false,
    })
    setFeedback(null)
  }, [product])

  const existingImage = useMemo(
    () => ({
      url: product?.image?.url ?? null,
      filename: product?.image?.filename ?? null,
    }),
    [product?.image?.url, product?.image?.filename],
  )

  const buildImagePayload = useCallback(() => {
    if (!imageState.file || !imageState.base64) {
      return undefined
    }

    return {
      filename: imageState.file.name,
      mimeType: imageState.file.type || 'application/octet-stream',
      base64Data: imageState.base64,
    }
  }, [imageState])

  const handleFileChange = useCallback(async (file: File | null) => {
    if (!file) {
      setImageState({ file: null, base64: null, remove: false })
      return
    }

    try {
      const base64 = await readFileAsDataUrl(file)
      setImageState({ file, base64, remove: false })
    } catch (error) {
      setFeedback({
        tone: 'negative',
        message: getUserFriendlyMessage(error, tProducts('feedback.errors.image_load')),
      })
    }
  }, [tProducts])

  const handleRemoveToggle = useCallback((checked: boolean) => {
    setImageState((prev) => ({
      file: checked ? null : prev.file,
      base64: checked ? null : prev.base64,
      remove: checked,
    }))
  }, [])

  const resetForm = useCallback(() => {
    if (!product) {
      return
    }

    setFormState({
      name: product.name,
      price: product.price.toString(),
      description: product.description ?? '',
      categoryId: product.categoryId ?? '',
    })
    setImageState({ file: null, base64: null, remove: false })
    setFeedback(null)
  }, [product])

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!productId) {
      return
    }

    if (!formState.name.trim()) {
      setFeedback({ tone: 'negative', message: t('form.feedback.missing_name') })
      return
    }

    const priceValue = formState.price.trim()
    const price = priceValue ? Number(priceValue) : undefined
    if (priceValue && Number.isNaN(price)) {
      setFeedback({ tone: 'negative', message: t('form.feedback.invalid_price') })
      return
    }

    setSaving(true)
    setFeedback(null)
    try {
      await productStore.updateProduct(productId, {
        name: formState.name.trim(),
        price,
        description: formState.description.trim() || undefined,
        categoryId: formState.categoryId || undefined,
        image: buildImagePayload(),
        removeImage: imageState.remove || undefined,
      })
      setFeedback({ tone: 'positive', message: t('form.feedback.success') })
      await productStore.loadProduct(productId)
    } catch (error) {
      setFeedback({
        tone: 'negative',
        message: getUserFriendlyMessage(error, t('form.feedback.error')),
      })
    } finally {
      setSaving(false)
    }
  }, [productId, formState, imageState, productStore, buildImagePayload, t])

  const handleDelete = useCallback(async () => {
    if (!productId) {
      return
    }
    if (!confirm(t('actions.delete_confirm'))) {
      return
    }

    setDeleting(true)
    setDeleteFeedback(null)
    try {
      await productStore.deleteProduct(productId)
      setDeleteFeedback({ tone: 'positive', message: t('actions.delete_success') })
      setTimeout(() => {
        router.replace('/products')
      }, 1200)
    } catch (error) {
      setDeleteFeedback({
        tone: 'negative',
        message: getUserFriendlyMessage(error, t('actions.delete_error')),
      })
    } finally {
      setDeleting(false)
    }
  }, [productId, productStore, router, t])

  const handleOpenStorefront = useCallback(() => {
    if (!productId) return
    if (typeof window === 'undefined') return
    const baseUrl = getStorefrontUrl().replace(/\/$/, '')
    const target = `${baseUrl}/products/${productId}`
    window.open(target, '_blank', 'noopener')
  }, [productId])

  if (!productId) {
    return <ErrorState message={t('errors.missing_product')} />
  }

  if (productStore.productLoading && !product) {
    return (
      <div className={styles.page}>
        <Link href="/products" className={styles.backLink}>
          {t('navigation.back')}
        </Link>
        <LoadingState label={t('loading')} />
      </div>
    )
  }

  if (productStore.productError) {
    return (
      <div className={styles.page}>
        <Link href="/products" className={styles.backLink}>
          {t('navigation.back')}
        </Link>
        <ErrorState message={productStore.productError} />
      </div>
    )
  }

  if (!product) {
    return null
  }

  const categoryName = product.category?.name ?? tProducts('table.cells.uncategorised')

  return (
    <div className={styles.page}>
      <Link href="/products" className={styles.backLink}>
        {t('navigation.back')}
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{t('header.title')}</h1>
        <p className={styles.subtitle}>{t('header.subtitle', { id: product.id })}</p>
      </header>

      <section className={styles.metaGrid}>
        <div className={styles.metaCard}>{t('meta.id', { id: product.id })}</div>
        <div className={styles.metaCard}>{t('meta.price', { price: product.price.toFixed(2) })}</div>
        <div className={styles.metaCard}>{t('meta.category', { category: categoryName })}</div>
      </section>

      <div className={styles.contentGrid}>
        <section className={classNames('surface-border', styles.card)}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('form.title')}</h2>
            <p className={styles.sectionSubtitle}>{t('form.subtitle')}</p>
          </div>
          <form className={styles.formGrid} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('form.fields.name')}</span>
              <input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={t('form.fields.name_placeholder')}
                disabled={saving}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('form.fields.price')}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formState.price}
                onChange={(event) => setFormState((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="0.00"
                disabled={saving}
              />
            </div>
            <div className={classNames(styles.fieldGroup, styles.fullWidth)}>
              <span className={styles.fieldLabel}>{t('form.fields.description')}</span>
              <textarea
                rows={4}
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                disabled={saving}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('form.fields.category')}</span>
              <select
                value={formState.categoryId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, categoryId: event.target.value }))
                }
                disabled={saving}
              >
                <option value="">{t('form.fields.category_placeholder')}</option>
                {categories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {feedback ? (
              <span
                className={
                  feedback.tone === 'positive' ? styles.feedbackSuccess : styles.feedbackError
                }
              >
                {feedback.message}
              </span>
            ) : null}

            <div className={classNames(styles.actions, styles.fullWidth)}>
              <button type="submit" className={styles.primaryButton} disabled={saving}>
                {saving ? t('form.actions.saving') : t('form.actions.save')}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={resetForm} disabled={saving}>
                {t('form.actions.reset')}
              </button>
            </div>
          </form>
        </section>

        <section className={classNames('surface-border', styles.card)}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('image.title')}</h2>
            <p className={styles.sectionSubtitle}>{t('image.subtitle')}</p>
          </div>
          <div className={styles.imageArea}>
            <div className={styles.imageField}>
              <input
                type="file"
                accept="image/*"
                disabled={saving || imageState.remove}
                onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
              />
              {imageState.base64 ? (
                <ModularImage
                  src={imageState.base64}
                  alt={t('image.preview_alt')}
                  width={120}
                  height={120}
                  sizes="120px"
                  className={styles.previewImage}
                />
              ) : existingImage.url && !imageState.remove ? (
                <ModularImage
                  src={existingImage.url}
                  alt={existingImage.filename ?? t('image.current')}
                  width={120}
                  height={120}
                  sizes="120px"
                  className={styles.previewImage}
                />
              ) : (
                <span className={styles.feedbackError}>{t('image.empty')}</span>
              )}
            </div>
            {(existingImage.url || imageState.remove) && (
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={imageState.remove}
                  onChange={(event) => handleRemoveToggle(event.target.checked)}
                  disabled={saving || Boolean(imageState.base64)}
                />
                {t('image.remove_toggle')}
              </label>
            )}
          </div>
        </section>

        <section className={classNames('surface-border', styles.card, styles.dangerZone)}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('actions.title')}</h2>
            <p className={styles.sectionSubtitle}>{t('actions.subtitle')}</p>
          </div>
          <div className={styles.actionsInline}>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t('form.actions.saving') : t('actions.delete')}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleOpenStorefront}>
              {t('actions.open_storefront')}
            </button>
          </div>
          {deleteFeedback ? (
            <span
              className={
                deleteFeedback.tone === 'positive' ? styles.feedbackSuccess : styles.feedbackError
              }
            >
              {deleteFeedback.message}
            </span>
          ) : null}
        </section>
      </div>
    </div>
  )
})

export default ProductDetailPage
