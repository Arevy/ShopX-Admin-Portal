import { makeAutoObservable, runInAction } from 'mobx'

import { MutationCustomerSupportCreateProduct } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportCreateProduct'
import { MutationCustomerSupportDeleteProduct } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportDeleteProduct'
import { MutationCustomerSupportUpdateProduct } from '@/common/queries/customerSupport/mutations/MutationCustomerSupportUpdateProduct'
import { QueryCustomerSupportProducts } from '@/common/queries/customerSupport/QueryCustomerSupportProducts'
import type RootContext from '@/common/stores/RootContext'
import { Product, Category } from '@/types/domain'
import type {
  CustomerSupportCreateProductVariables,
  CustomerSupportProductsVariables,
  CustomerSupportUpdateProductVariables,
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
}

export class ProductStore {
  private readonly root: RootContext
  products: Product[] = []
  categories: Category[] = []
  loading = false
  error: string | null = null
  filters: ProductFilters = { limit: 20, offset: 0 }

  constructor(root: RootContext) {
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

      runInAction(() => {
        this.products = response.data?.customerSupport.products ?? []
        this.categories = response.data?.customerSupport.categories ?? []
      })
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : 'Unexpected error fetching products.'
        this.products = []
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }

  async createProduct(input: ProductFormInput) {
    const variables: CustomerSupportCreateProductVariables = {
      name: input.name,
      price: input.price,
      description: input.description,
      categoryId: input.categoryId,
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

  async updateProduct(id: string, input: Partial<ProductFormInput>) {
    const variables: CustomerSupportUpdateProductVariables = {
      id,
      name: input.name,
      price: input.price,
      description: input.description,
      categoryId: input.categoryId,
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
