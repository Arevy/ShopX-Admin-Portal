import { makeAutoObservable, runInAction } from 'mobx'

import {
  MutationCustomerSupportCreateProduct,
  MutationCustomerSupportDeleteProduct,
  MutationCustomerSupportUpdateProduct,
  QueryCustomerSupportProducts,
  QueryCustomerSupportProductDetail,
} from '@/graphql/customerSupport'
import type { RootStore } from '@/stores/rootStore'
import { getUserFriendlyMessage } from '@/lib/getUserFriendlyMessage'
import { Product, Category } from '@/types/domain'
import type {
  CustomerSupportCreateProductVariables,
  CustomerSupportProductsVariables,
  CustomerSupportUpdateProductVariables,
  ProductImageInput,
} from '@/types/graphql'

interface ProductFilters {
  limit?: number
  offset?: number
  name?: string
  categoryId?: string
}

interface ProductFormInput {
  name: string
  price: number
  description?: string
  categoryId: string
  image?: ProductImageInput
}

export class ProductStore {
  private readonly root: RootStore
  products: Product[] = []
  categories: Category[] = []
  selectedProduct: Product | null = null
  loading = false
  error: string | null = null
  productLoading = false
  productError: string | null = null
  filters: ProductFilters = { limit: 20, offset: 0 }

  constructor(root: RootStore) {
    this.root = root
    makeAutoObservable(this, {}, { autoBind: true })
  }

  private get filtersWithDefaults() {
    return {
      limit: 20,
      offset: 0,
      ...this.filters,
    }
  }

  async fetchProducts(filters?: ProductFilters) {
    this.loading = true
    this.error = null

    const merged: ProductFilters = {
      ...this.filtersWithDefaults,
      ...filters,
    }

    const sanitized: CustomerSupportProductsVariables = {
      limit: typeof merged.limit === 'number' ? merged.limit : 20,
      offset: typeof merged.offset === 'number' ? merged.offset : 0,
      name: merged.name?.trim() || undefined,
      categoryId: merged.categoryId?.trim() || undefined,
    }

    this.filters = {
      limit: sanitized.limit,
      offset: sanitized.offset,
      name: sanitized.name,
      categoryId: sanitized.categoryId,
    }

    try {
      const response = await this.root.apiService.executeGraphQL(
        QueryCustomerSupportProducts,
        sanitized,
      )

      if (response.errors?.length) {
        throw new Error(response.errors.map((err) => err.message).join('; '))
      }

      const dataset = response.data?.customerSupport.products ?? []
      const categoryList = response.data?.customerSupport.categories ?? []

      const normalizedName = sanitized.name?.toLowerCase() ?? null
      const normalizedCategoryId = sanitized.categoryId ?? null

      const filteredProducts = dataset.filter((product) => {
        if (normalizedName && !product.name.toLowerCase().includes(normalizedName)) {
          return false
        }

        if (
          normalizedCategoryId &&
          String(product.categoryId ?? '') !== normalizedCategoryId
        ) {
          return false
        }

        return true
      })

      runInAction(() => {
        this.products = filteredProducts
        this.categories = categoryList
      })
    } catch (error) {
      runInAction(() => {
        this.error = getUserFriendlyMessage(
          error,
          'Unexpected error fetching products.',
        )
        this.products = []
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  resetSelectedProduct() {
    this.selectedProduct = null
    this.productError = null
  }

  async loadProduct(id: string) {
    this.productLoading = true
    this.productError = null

    try {
      const response = await this.root.apiService.executeGraphQL(
        QueryCustomerSupportProductDetail,
        { id },
      )

      if (response.errors?.length) {
        throw new Error(response.errors.map((err) => err.message).join('; '))
      }

      runInAction(() => {
        this.selectedProduct = response.data?.customerSupport.product ?? null
        const fetchedCategories = response.data?.customerSupport.categories ?? []
        if (fetchedCategories.length) {
          this.categories = fetchedCategories.map((category) => ({
            id: category.id,
            name: category.name,
            description: null,
          }))
        }
      })
    } catch (error) {
      runInAction(() => {
        this.productError = getUserFriendlyMessage(
          error,
          'Failed to load product details.',
        )
        this.selectedProduct = null
      })
    } finally {
      runInAction(() => {
        this.productLoading = false
      })
    }
  }

  async createProduct(input: ProductFormInput) {
    const variables: CustomerSupportCreateProductVariables = {
      name: input.name,
      price: input.price,
      description: input.description,
      categoryId: input.categoryId,
      image: input.image,
    }

    const response = await this.root.apiService.executeGraphQL(
      MutationCustomerSupportCreateProduct,
      variables,
    )

    if (response.errors?.length) {
      throw new Error(response.errors.map((err) => err.message).join('; '))
    }

    await this.fetchProducts()
  }

  async updateProduct(
    id: string,
    input: Partial<ProductFormInput> & { removeImage?: boolean },
  ) {
    const { removeImage, ...payload } = input

    const variables: CustomerSupportUpdateProductVariables = {
      id,
      name: payload.name,
      price: payload.price,
      description: payload.description,
      categoryId: payload.categoryId,
      image: payload.image,
      removeImage,
    }

    const response = await this.root.apiService.executeGraphQL(
      MutationCustomerSupportUpdateProduct,
      variables,
    )

    if (response.errors?.length) {
      throw new Error(response.errors.map((err) => err.message).join('; '))
    }

    await this.fetchProducts()
  }

  async deleteProduct(id: string) {
    const response = await this.root.apiService.executeGraphQL(
      MutationCustomerSupportDeleteProduct,
      { id },
    )

    if (response.errors?.length) {
      throw new Error(response.errors.map((err) => err.message).join('; '))
    }

    await this.fetchProducts()
  }

  get categoryOptions() {
    return this.categories.map((category) => ({
      value: category.id,
      label: category.name,
    }))
  }
}
