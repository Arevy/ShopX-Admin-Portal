'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'

import { useStores } from '@/common/hooks/useStores'
import { getUserFriendlyMessage } from '@/common/utils/getUserFriendlyMessage'
import { Product } from '@/types/domain'
import type { ProductImageInput } from '@/types/graphql'

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

export const useProducts = () => {
  const { rootContext } = useStores()
  const productStore = rootContext.productStore
  const [nameFilter, setNameFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
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
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    void productStore.fetchProducts()
  }, [productStore])

  const handleFilter = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      void productStore.fetchProducts({
        name: nameFilter || undefined,
        categoryId: categoryFilter || undefined,
      })
    },
    [productStore, nameFilter, categoryFilter],
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
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file.'))
      reader.readAsDataURL(file)
    })
  }, [])

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
        setFeedback(
          getUserFriendlyMessage(error, 'Failed to load the selected image.'),
        )
      }
    },
    [readFileAsDataUrl],
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
        setFeedback(
          getUserFriendlyMessage(error, 'Failed to load the selected image.'),
        )
      }
    },
    [readFileAsDataUrl],
  )

  const handleEditRemoveImageToggle = useCallback((checked: boolean) => {
    setEditForm((prev) => ({
      ...prev,
      removeImage: checked,
      imageFile: checked ? null : prev.imageFile,
      imageBase64: checked ? null : prev.imageBase64,
    }))
  }, [])

  const handleCreate = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (!createForm.name || !createForm.price || !createForm.categoryId) {
        setFeedback('Name, price and category are required.')
        return
      }

      try {
        setCreating(true)
        await productStore.createProduct({
          name: createForm.name,
          price: Number(createForm.price),
          description: createForm.description || undefined,
          categoryId: createForm.categoryId,
          image: buildImagePayload(createForm.imageFile, createForm.imageBase64),
        })
        setCreateForm({
          name: '',
          price: '',
          description: '',
          categoryId: '',
          imageFile: null,
          imageBase64: null,
        })
        setFeedback('Product created successfully!')
      } catch (error) {
        setFeedback(
          getUserFriendlyMessage(error, 'Failed to create product.'),
        )
      } finally {
        setCreating(false)
      }
    },
    [productStore, createForm, buildImagePayload],
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
        await productStore.updateProduct(editForm.id, {
          name: editForm.name || undefined,
          price: editForm.price ? Number(editForm.price) : undefined,
          description: editForm.description || undefined,
          categoryId: editForm.categoryId || undefined,
          image: buildImagePayload(editForm.imageFile, editForm.imageBase64),
          removeImage: editForm.removeImage,
        })
        setFeedback(`Product ${editForm.id} updated.`)
        resetEdit()
      } catch (error) {
        setFeedback(
          getUserFriendlyMessage(error, 'Failed to update product.'),
        )
      } finally {
        setUpdating(false)
      }
    },
    [productStore, editForm, resetEdit, buildImagePayload],
  )

  const handleDelete = useCallback(
    async (productId: string) => {
      setFeedback(null)
      try {
        await productStore.deleteProduct(productId)
        setFeedback(`Product ${productId} removed.`)
      } catch (error) {
        setFeedback(
          getUserFriendlyMessage(error, 'Failed to delete product.'),
        )
      }
    },
    [productStore],
  )

  return {
    products: productStore.products,
    categories: productStore.categoryOptions,
    loading: productStore.loading,
    error: productStore.error,
    activeFilters: productStore.filters,
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
