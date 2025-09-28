'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { getUserFriendlyMessage } from '@/common/utils/getUserFriendlyMessage'
import { useTranslation } from '@/i18n'
import type { Category, Product } from '@/types/domain'
import type { ProductImageInput } from '@/types/graphql'
import { QueryCustomerSupportProducts } from '@/common/queries/customerSupport/QueryCustomerSupportProducts'
import { MutationCustomerSupportCreateProduct } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportCreateProduct'
import { MutationCustomerSupportUpdateProduct } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportUpdateProduct'
import { MutationCustomerSupportDeleteProduct } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportDeleteProduct'

interface ProductFormState {
  name: string
  price: string
  description: string
  categoryId: string
  imageFile: File | null
  imageBase64: string | null
}

interface EditFormState extends ProductFormState {
  id: string
  removeImage: boolean
  existingImageUrl: string | null
  existingImageFilename: string | null
}

type Feedback = {
  tone: 'positive' | 'negative'
  message: string
} | null

type GraphQLProductRecord = {
  id: string | number
  name: string
  price: number | string
  description?: string | null
  categoryId?: string | null
  category?: {
    id: string | number
    name: string
    description?: string | null
  } | null
  image?: {
    url: string
    filename?: string | null
    mimeType?: string | null
    updatedAt?: string | null
  } | null
}

export const useProducts = () => {
  const { t } = useTranslation('Page_Admin_Products')
  const [nameFilter, setNameFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeFilters, setActiveFilters] = useState<{ name?: string; categoryId?: string }>({})
  const [products, setProducts] = useState<Product[]>([])
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<ProductFormState>({
    name: '',
    price: '',
    description: '',
    categoryId: '',
    imageFile: null,
    imageBase64: null,
  })
  const [editForm, setEditForm] = useState<EditFormState>({
    id: '',
    name: '',
    price: '',
    description: '',
    categoryId: '',
    imageFile: null,
    imageBase64: null,
    removeImage: false,
    existingImageUrl: null,
    existingImageFilename: null,
  })
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const graphQLEndpoint = useMemo(
    () => process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '/api/support-graphql',
    [],
  )

  const executeGraphQL = useCallback(
    async <T,>(query: string, variables?: Record<string, unknown>): Promise<T> => {
      const response = await fetch(graphQLEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ query, variables }),
      })

      const payload = (await response.json()) as {
        data?: T
        errors?: Array<{ message?: string | null } | null> | null
      }

      if (!response.ok || (payload.errors && payload.errors.length > 0)) {
        const message = payload.errors
          ?.map((item) => item?.message)
          .filter((value): value is string => Boolean(value))
          .join('\n')

        throw new Error(message || response.statusText)
      }

      if (!payload.data) {
        throw new Error('GraphQL response was empty.')
      }

      return payload.data
    },
    [graphQLEndpoint],
  )

  const readFileAsDataUrl = useCallback((file: File): Promise<string> => {
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
  }, [t])

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

  const handleEditImageChange = useCallback(
    async (file: File | null) => {
      if (!file) {
        setEditForm((prev) => ({
          ...prev,
          imageFile: null,
          imageBase64: null,
        }))
        return
      }

      try {
        const base64 = await readFileAsDataUrl(file)
        setEditForm((prev) => ({
          ...prev,
          imageFile: file,
          imageBase64: base64,
          removeImage: false,
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

  const handleEditRemoveImageToggle = useCallback((checked: boolean) => {
    setEditForm((prev) => ({
      ...prev,
      removeImage: checked,
      imageFile: checked ? null : prev.imageFile,
      imageBase64: checked ? null : prev.imageBase64,
    }))
  }, [])

  const deserialiseProduct = useCallback(
    (product: GraphQLProductRecord): Product => ({
      id: String(product.id),
      name: product.name,
      price: Number(product.price ?? 0),
      description: product.description ?? null,
      categoryId: product.categoryId ?? null,
      category: product.category
        ? {
            id: String(product.category.id),
            name: product.category.name,
            description: product.category.description ?? null,
          }
        : null,
      image: product.image
        ? {
            filename: product.image.filename ?? 'product-image',
            mimeType: product.image.mimeType ?? 'application/octet-stream',
            url: product.image.url,
            updatedAt: product.image.updatedAt ?? null,
          }
        : null,
    }),
    [],
  )

  const fetchProducts = useCallback(
    async (overrides?: { name?: string; categoryId?: string }) => {
      const nextFilters = {
        name: overrides?.name ?? nameFilter,
        categoryId: overrides?.categoryId ?? categoryFilter,
      }

      setLoading(true)
      setError(null)

      try {
        const data = await executeGraphQL<{
          customerSupport: { products: GraphQLProductRecord[]; categories: Category[] } | null
        }>(
          QueryCustomerSupportProducts.queryString,
          {
            limit: 100,
            name: nextFilters.name?.trim() || undefined,
            categoryId: nextFilters.categoryId?.trim() || undefined,
          },
        )

        const customerSupport = data.customerSupport ?? { products: [], categories: [] }
        setProducts(customerSupport.products.map(deserialiseProduct))
        setCategoryOptions(
          (customerSupport.categories ?? []).map((category) => ({
            value: String(category.id),
            label: category.name ?? `#${category.id}`,
          })),
        )
        setActiveFilters(nextFilters)
      } catch (err) {
        setError(getUserFriendlyMessage(err, t('feedback.errors.fetch')))
      } finally {
        setLoading(false)
      }
    },
    [categoryFilter, deserialiseProduct, executeGraphQL, nameFilter, t],
  )

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  const handleFilter = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      void fetchProducts({ name: nameFilter, categoryId: categoryFilter })
    },
    [categoryFilter, fetchProducts, nameFilter],
  )

  const handleCreate = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (!createForm.name || !createForm.price || !createForm.categoryId) {
        setFeedback({ tone: 'negative', message: t('feedback.errors.missing_required_fields') })
        return
      }

      try {
        setCreating(true)
        await executeGraphQL<{ customerSupport: { addProduct: unknown } | null }>(
          MutationCustomerSupportCreateProduct.queryString,
          {
            name: createForm.name,
            price: Number(createForm.price),
            description: createForm.description || undefined,
            categoryId: createForm.categoryId,
            image: buildImagePayload(createForm.imageFile, createForm.imageBase64),
          },
        )
        setCreateForm({
          name: '',
          price: '',
          description: '',
          categoryId: '',
          imageFile: null,
          imageBase64: null,
        })
        setFeedback({ tone: 'positive', message: t('feedback.success.create') })
        await fetchProducts()
      } catch (error) {
        setFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('feedback.errors.create')),
        })
      } finally {
        setCreating(false)
      }
    },
    [createForm, buildImagePayload, executeGraphQL, fetchProducts, t],
  )

  const beginEdit = useCallback((product: Product) => {
    setEditForm({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      description: product.description ?? '',
      categoryId: product.categoryId ?? '',
      imageFile: null,
      imageBase64: null,
      removeImage: false,
      existingImageUrl: product.image?.url ?? null,
      existingImageFilename: product.image?.filename ?? null,
    })
    setFeedback(null)
  }, [])

  const resetEdit = useCallback(() => {
    setEditForm({
      id: '',
      name: '',
      price: '',
      description: '',
      categoryId: '',
      imageFile: null,
      imageBase64: null,
      removeImage: false,
      existingImageUrl: null,
      existingImageFilename: null,
    })
  }, [])

  const handleUpdate = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (!editForm.id) {
        return
      }

      try {
        setUpdating(true)
        await executeGraphQL<{ customerSupport: { updateProduct: unknown } | null }>(
          MutationCustomerSupportUpdateProduct.queryString,
          {
            id: editForm.id,
            name: editForm.name || undefined,
            price: editForm.price ? Number(editForm.price) : undefined,
            description: editForm.description || undefined,
            categoryId: editForm.categoryId || undefined,
            image: buildImagePayload(editForm.imageFile, editForm.imageBase64),
            removeImage: editForm.removeImage || undefined,
          },
        )
        setFeedback({ tone: 'positive', message: t('feedback.success.update', { id: editForm.id }) })
        resetEdit()
        await fetchProducts()
      } catch (error) {
        setFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('feedback.errors.update')),
        })
      } finally {
        setUpdating(false)
      }
    },
    [editForm, resetEdit, buildImagePayload, executeGraphQL, fetchProducts, t],
  )

  const handleDelete = useCallback(
    async (productId: string) => {
      setFeedback(null)
      try {
        await executeGraphQL<{ customerSupport: { deleteProduct: boolean } | null }>(
          MutationCustomerSupportDeleteProduct.queryString,
          { id: productId },
        )
        setFeedback({ tone: 'positive', message: t('feedback.success.delete', { id: productId }) })
        await fetchProducts()
      } catch (error) {
        setFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('feedback.errors.delete')),
        })
      }
    },
    [executeGraphQL, fetchProducts, t],
  )

  return {
    products,
    categories: categoryOptions,
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
  }
}
