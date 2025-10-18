'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { getUserFriendlyMessage } from '@/lib/getUserFriendlyMessage'
import { useTranslation } from '@/i18n'
import type { ProductImageInput } from '@/types/graphql'
import { useRootContext } from '@/stores/StoreProvider'

interface ProductFormState {
  name: string
  price: string
  description: string
  categoryId: string
  imageFile: File | null
  imageBase64: string | null
}

type Feedback = {
  tone: 'positive' | 'negative'
  message: string
} | null

const EMPTY_CREATE_FORM: ProductFormState = {
  name: '',
  price: '',
  description: '',
  categoryId: '',
  imageFile: null,
  imageBase64: null,
}

export const useProducts = () => {
  const { productStore } = useRootContext()
  const { t } = useTranslation('Page_Admin_Products')

  const [nameFilter, setNameFilter] = useState(productStore.filters.name ?? '')
  const [categoryFilter, setCategoryFilter] = useState(productStore.filters.categoryId ?? '')
  const [createForm, setCreateForm] = useState<ProductFormState>(EMPTY_CREATE_FORM)
  const [creating, setCreating] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    void productStore.fetchProducts()
  }, [productStore])

  const readFileAsDataUrl = useCallback(
    (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          if (typeof result === 'string') {
            resolve(result)
          } else {
            reject(new Error('Unexpected file reader result.'))
          }
        }
        reader.onerror = () =>
          reject(reader.error ?? new Error(t('feedback.errors.image_load')))
        reader.readAsDataURL(file)
      })
    },
    [t],
  )

  const buildImagePayload = useCallback(
    (file: File | null, base64: string | null): ProductImageInput | undefined => {
      if (!file || !base64) {
        return undefined
      }

      return {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64Data: base64,
      }
    },
    [],
  )

  const handleCreateImageChange = useCallback(
    async (file: File | null) => {
      if (!file) {
        setCreateForm((prev) => ({ ...prev, imageFile: null, imageBase64: null }))
        return
    }

    try {
      const base64 = await readFileAsDataUrl(file)
      setCreateForm((prev) => ({
          ...prev,
          imageFile: file,
          imageBase64: base64,
        }))
      } catch (error) {
        setFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('feedback.errors.image_load')),
        })
      }
    },
    [readFileAsDataUrl, t],
  )

  const handleFilter = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setFeedback(null)
      void productStore.fetchProducts({
        name: nameFilter.trim() || undefined,
        categoryId: categoryFilter.trim() || undefined,
      })
    },
    [categoryFilter, nameFilter, productStore],
  )

  const handleCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!createForm.name || !createForm.price || !createForm.categoryId) {
        setFeedback({ tone: 'negative', message: t('feedback.errors.missing_required_fields') })
        return
      }

      const price = Number(createForm.price)

      setFeedback(null)
      setCreating(true)

      try {
        await productStore.createProduct({
          name: createForm.name,
          price,
          description: createForm.description || undefined,
          categoryId: createForm.categoryId,
          image: buildImagePayload(createForm.imageFile, createForm.imageBase64),
        })

        setCreateForm(EMPTY_CREATE_FORM)
        setFeedback({ tone: 'positive', message: t('feedback.success.create') })
      } catch (error) {
        setFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('feedback.errors.create')),
        })
      } finally {
        setCreating(false)
      }
    },
    [buildImagePayload, createForm, productStore, t],
  )

  const handleDelete = useCallback(
    async (productId: string) => {
      setFeedback(null)
      try {
        await productStore.deleteProduct(productId)
        setFeedback({ tone: 'positive', message: t('feedback.success.delete', { id: productId }) })
      } catch (error) {
        setFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('feedback.errors.delete')),
        })
      }
    },
    [productStore, t],
  )

  const activeFilters = useMemo(
    () => ({
      name: productStore.filters.name ?? undefined,
      categoryId: productStore.filters.categoryId ?? undefined,
    }),
    [productStore.filters.categoryId, productStore.filters.name],
  )

  return {
    products: productStore.products,
    categories: productStore.categoryOptions,
    loading: productStore.loading,
    error: productStore.error,
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
    handleDelete,
    feedback,
  }
}
