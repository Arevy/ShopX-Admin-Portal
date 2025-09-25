import ApiService from '@/common/services/ApiService'
import { CmsStore } from '@/common/stores/domain/CmsStore'
import { OrderStore } from '@/common/stores/domain/OrderStore'
import { ProductStore } from '@/common/stores/domain/ProductStore'
import { SupportStore } from '@/common/stores/domain/SupportStore'
import { UserStore } from '@/common/stores/domain/UserStore'

export interface RootContextOptions {
  endpoint?: string
  token?: string
}

class RootContext {
  readonly apiService: ApiService

  productStore: ProductStore
  userStore: UserStore
  orderStore: OrderStore
  supportStore: SupportStore
  cmsStore: CmsStore

  constructor(options?: RootContextOptions) {
    this.apiService = new ApiService(this, options?.endpoint)
    if (options?.token) {
      this.apiService.setAuthToken(options.token)
    }

    this.productStore = new ProductStore(this)
    this.userStore = new UserStore(this)
    this.orderStore = new OrderStore(this)
    this.supportStore = new SupportStore(this)
    this.cmsStore = new CmsStore(this)
  }

  setAuthToken(token?: string) {
    this.apiService.setAuthToken(token)
  }
}

export default RootContext
