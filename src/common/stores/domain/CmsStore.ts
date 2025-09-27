import { makeAutoObservable, runInAction } from 'mobx'

import {
  MutationCustomerSupportCreateCmsPage,
  MutationCustomerSupportDeleteCmsPage,
  MutationCustomerSupportPublishCmsPage,
  MutationCustomerSupportUpdateCmsPage,
} from '@/common/queries/cms'
import { QueryCustomerSupportCmsPage } from '@/common/queries/cms/QueryCustomerSupportCmsPage'
import { QueryCustomerSupportCmsPages } from '@/common/queries/cms/QueryCustomerSupportCmsPages'
import type RootContext from '@/common/stores/RootContext'
import { getUserFriendlyMessage } from '@/common/utils/getUserFriendlyMessage'
import type { CmsPage, CmsStatus } from '@/types/domain'
import type { CustomerSupportCmsPagesVariables } from '@/types/graphql'

export class CmsStore {
  private readonly root: RootContext

  pages: CmsPage[] = []
  selectedPage: CmsPage | null = null
  loading = false
  saving = false
  error: string | null = null
  filters: { status?: CmsStatus; slug: string } = { slug: '' }

  constructor(root: RootContext) {
    this.root = root
    makeAutoObservable<CmsStore, 'root'>(this, { root: false }, { autoBind: true })
  }

  selectPage(page: CmsPage | null) {
    this.selectedPage = page
  }

  private matchesActiveFilters(page: CmsPage, filters = this.filters) {
    if (filters.status && page.status !== filters.status) {
      return false
    }

    const normalizedSlug = filters.slug.trim().toLowerCase()
    if (normalizedSlug && !page.slug.toLowerCase().includes(normalizedSlug)) {
      return false
    }

    return true
  }

  async fetchPages(filter?: { status?: CmsStatus | null; slug?: string | null }) {
    this.loading = true
    this.error = null
    try {
      const statusOverrideProvided =
        filter && Object.prototype.hasOwnProperty.call(filter, 'status')
      const slugOverrideProvided =
        filter && Object.prototype.hasOwnProperty.call(filter, 'slug')

      const targetStatus = statusOverrideProvided
        ? filter?.status ?? undefined
        : this.filters.status ?? undefined

      const rawSlug = slugOverrideProvided
        ? (filter?.slug ?? '')
        : this.filters.slug ?? ''

      const normalizedSlug = rawSlug.trim()
      const normalizedSlugLower = normalizedSlug.toLowerCase()

      const variables: CustomerSupportCmsPagesVariables = {
        status: targetStatus,
        search: normalizedSlug || undefined,
      }

      this.filters = {
        status: targetStatus,
        slug: normalizedSlug,
      }

      const response = await this.root.apiService.executeGraphQL(
        QueryCustomerSupportCmsPages,
        variables,
      )

      const pages = response.data?.customerSupport.cmsPages ?? []

      const filteredPages = pages.filter((page) => {
        if (targetStatus && page.status !== targetStatus) {
          return false
        }

        if (normalizedSlugLower && !page.slug.toLowerCase().includes(normalizedSlugLower)) {
          return false
        }

        return true
      })

      runInAction(() => {
        this.pages = filteredPages
      })
    } catch (error) {
      console.error('Failed to fetch CMS pages', error)
      const message = getUserFriendlyMessage(error, "We couldn't load the CMS pages.")
      this.error = message
    } finally {
      this.loading = false
    }
  }

  async loadPage(idOrSlug: { id?: string; slug?: string }) {
    this.loading = true
    this.error = null
    try {
      const response = await this.root.apiService.executeGraphQL(
        QueryCustomerSupportCmsPage,
        idOrSlug,
      )
      const page = response.data?.customerSupport.cmsPage ?? null
      runInAction(() => {
        this.selectedPage = page
      })
      return page
    } catch (error) {
      console.error('Failed to load CMS page', error)
      const message = getUserFriendlyMessage(error, "We couldn't load the CMS page.")
      this.error = message
      return null
    } finally {
      this.loading = false
    }
  }

  async createPage(input: {
    slug: string
    title: string
    excerpt?: string | null
    body: string
    status?: CmsStatus
    publishedAt?: string | null
  }) {
    this.saving = true
    this.error = null
    try {
      const response = await this.root.apiService.executeGraphQL(
        MutationCustomerSupportCreateCmsPage,
        { input },
      )
      const page = response.data?.customerSupport.createCmsPage
      if (page) {
        runInAction(() => {
          if (this.matchesActiveFilters(page)) {
            this.pages = [page, ...this.pages.filter((item) => item.id !== page.id)]
          }
          this.selectedPage = page
        })
      }
      return page
    } catch (error) {
      console.error('Failed to create CMS page', error)
      const message = getUserFriendlyMessage(error, "We couldn't create the CMS page.")
      this.error = message
      throw error
    } finally {
      this.saving = false
    }
  }

  async updatePage(id: string, input: {
    slug?: string
    title?: string
    excerpt?: string | null
    body?: string
    status?: CmsStatus
    publishedAt?: string | null
  }) {
    this.saving = true
    this.error = null
    try {
      const response = await this.root.apiService.executeGraphQL(
        MutationCustomerSupportUpdateCmsPage,
        { id, input },
      )
      const page = response.data?.customerSupport.updateCmsPage
      if (page) {
        runInAction(() => {
          if (this.matchesActiveFilters(page)) {
            const existingIndex = this.pages.findIndex((item) => item.id === page.id)
            if (existingIndex === -1) {
              this.pages = [page, ...this.pages]
            } else {
              this.pages = this.pages.map((existing) =>
                existing.id === page.id ? page : existing,
              )
            }
          } else {
            this.pages = this.pages.filter((existing) => existing.id !== page.id)
          }
          this.selectedPage = page
        })
      }
      return page
    } catch (error) {
      console.error('Failed to update CMS page', error)
      const message = getUserFriendlyMessage(error, "We couldn't update the CMS page.")
      this.error = message
      throw error
    } finally {
      this.saving = false
    }
  }

  async publishPage(id: string) {
    this.saving = true
    this.error = null
    try {
      const response = await this.root.apiService.executeGraphQL(
        MutationCustomerSupportPublishCmsPage,
        { id },
      )
      const page = response.data?.customerSupport.publishCmsPage
      if (page) {
        runInAction(() => {
          if (this.matchesActiveFilters(page)) {
            const existingIndex = this.pages.findIndex((item) => item.id === page.id)
            if (existingIndex === -1) {
              this.pages = [page, ...this.pages]
            } else {
              this.pages = this.pages.map((existing) =>
                existing.id === page.id ? page : existing,
              )
            }
          } else {
            this.pages = this.pages.filter((existing) => existing.id !== page.id)
          }
          this.selectedPage = page
        })
      }
      return page
    } catch (error) {
      console.error('Failed to publish CMS page', error)
      const message = getUserFriendlyMessage(error, "We couldn't publish the CMS page.")
      this.error = message
      throw error
    } finally {
      this.saving = false
    }
  }

  async deletePage(id: string) {
    this.saving = true
    this.error = null
    try {
      await this.root.apiService.executeGraphQL(
        MutationCustomerSupportDeleteCmsPage,
        { id },
      )
      runInAction(() => {
        this.pages = this.pages.filter((page) => page.id !== id)
        if (this.selectedPage?.id === id) {
          this.selectedPage = null
        }
      })
    } catch (error) {
      console.error('Failed to delete CMS page', error)
      const message = getUserFriendlyMessage(error, "We couldn't delete the CMS page.")
      this.error = message
      throw error
    } finally {
      this.saving = false
    }
  }
}
