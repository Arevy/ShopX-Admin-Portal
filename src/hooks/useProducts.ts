'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'

import { useStores } from '@/common/hooks/useStores'
import { Product } from '@/types/domain'

interface ProductFormState {
  name: string
  price: string
  description: string
  categoryId: string
}

interface EditFormState extends ProductFormState {
  id: string
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
  })
  const [editForm, setEditForm] = useState<EditFormState>({
    id: '',
    name: '',
    price: '',
    description: '',
    categoryId: '',
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
        })
        setCreateForm({ name: '', price: '', description: '', categoryId: '' })
        setFeedback('Product created successfully!')
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Failed to create product.')
      } finally {
        setCreating(false)
      }
    },
    [productStore, createForm],
  )

  const beginEdit = useCallback((product: Product) => {
    setEditForm({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      description: product.description ?? '',
      categoryId: product.categoryId ?? '',
    })
    setFeedback(null)
  }, [])

  const resetEdit = useCallback(() => {
    setEditForm({ id: '', name: '', price: '', description: '', categoryId: '' })
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
        })
        setFeedback(`Product ${editForm.id} updated.`)
        resetEdit()
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Failed to update product.')
      } finally {
        setUpdating(false)
      }
    },
    [productStore, editForm, resetEdit],
  )

  const handleDelete = useCallback(
    async (productId: string) => {
      setFeedback(null)
      try {
        await productStore.deleteProduct(productId)
        setFeedback(`Product ${productId} removed.`)
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Failed to delete product.')
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
    creating,
    editForm,
    setEditForm,
    beginEdit,
    resetEdit,
    handleUpdate,
    updating,
    handleDelete,
    feedback,
  }
}
