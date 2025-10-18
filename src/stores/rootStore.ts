import ApiService from '@/lib/apiService'
import { CmsStore } from '@/stores/cmsStore'
import { ProductStore } from '@/stores/productStore'
import { SupportStore } from '@/stores/supportStore'
import { UserStore } from '@/stores/userStore'

export interface RootStoreOptions {
  endpoint?: string
  token?: string
}

export class RootStore {
  readonly apiService: ApiService

  readonly productStore: ProductStore
  readonly userStore: UserStore
  readonly supportStore: SupportStore
  readonly cmsStore: CmsStore

  constructor(options?: RootStoreOptions) {
    this.apiService = new ApiService(this, options?.endpoint)
    if (options?.token) {
      this.apiService.setAuthToken(options.token)
    }

    this.productStore = new ProductStore(this)
    this.userStore = new UserStore(this)
    this.supportStore = new SupportStore(this)
    this.cmsStore = new CmsStore(this)
  }

  setAuthToken(token?: string) {
    this.apiService.setAuthToken(token)
  }
}

export const createRootStore = (options?: RootStoreOptions) => new RootStore(options)
