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
import type { CmsPage, CmsStatus } from '@/types/domain'

export class CmsStore {
  private readonly root: RootContext

  pages: CmsPage[] = []
  selectedPage: CmsPage | null = null
  loading = false
  saving = false
  error: string | null = null

  constructor(root: RootContext) {
    this.root = root
    makeAutoObservable<CmsStore, 'root'>(this, { root: false }, { autoBind: true })
  }

  selectPage(page: CmsPage | null) {
    this.selectedPage = page
  }

  async fetchPages(filter?: { status?: CmsStatus; search?: string }) {
    this.loading = true
    this.error = null
    try {
      const response = await this.root.apiService.executeGraphQL(
        QueryCustomerSupportCmsPages,
        filter,
      )
      const pages = response.data?.customerSupport.cmsPages ?? []
      runInAction(() => {
        this.pages = pages
      })
    } catch (error) {
      console.error('Failed to fetch CMS pages', error)
      const message = error instanceof Error ? error.message : "We couldn't load the CMS pages."
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
      const message = error instanceof Error ? error.message : "We couldn't load the CMS page."
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
          this.pages = [page, ...this.pages.filter((item) => item.id !== page.id)]
          this.selectedPage = page
        })
      }
      return page
    } catch (error) {
      console.error('Failed to create CMS page', error)
      const message = error instanceof Error ? error.message : "We couldn't create the CMS page."
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
          this.pages = this.pages.map((existing) =>
            existing.id === page.id ? page : existing,
          )
          this.selectedPage = page
        })
      }
      return page
    } catch (error) {
      console.error('Failed to update CMS page', error)
      const message = error instanceof Error ? error.message : "We couldn't update the CMS page."
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
          this.pages = this.pages.map((existing) =>
            existing.id === page.id ? page : existing,
          )
          this.selectedPage = page
        })
      }
      return page
    } catch (error) {
      console.error('Failed to publish CMS page', error)
      const message = error instanceof Error ? error.message : "We couldn't publish the CMS page."
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
      const message = error instanceof Error ? error.message : "We couldn't delete the CMS page."
      this.error = message
      throw error
    } finally {
      this.saving = false
    }
  }
}
