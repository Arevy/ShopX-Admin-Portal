import {
  Category,
  Order,
  Product,
  User,
  UserRole,
  CmsPage,
  CmsStatus,
  Address,
  Cart,
  Wishlist,
  Review,
} from '@/types/domain'

export interface ProductImageInput {
  filename: string
  mimeType: string
  base64Data: string
}

export interface CustomerSupportProductsVariables {
  limit?: number
  offset?: number
  name?: string
  categoryId?: string
}

export interface CustomerSupportProductsResponse {
  customerSupport: {
    products: Product[]
    categories: Category[]
  }
}

export interface CustomerSupportSessionResponse {
  customerSupport: {
    __typename: string
  } | null
}

export interface CustomerSupportOrdersVariables {
  userId?: string
  status?: string
  limit?: number
  offset?: number
}

export interface CustomerSupportOrdersResponse {
  customerSupport: {
    orders: Order[]
  }
}

export interface CustomerSupportOrderDetailVariables {
  orderId: string
}

export interface CustomerSupportOrderDetailResponse {
  customerSupport: {
    order: Order | null
  }
}

export interface CustomerSupportUsersVariables {
  email?: string
  role?: UserRole
}

export interface CustomerSupportUsersResponse {
  customerSupport: {
    users: User[]
  }
}

export interface CustomerSupportOverviewVariables {
  productLimit?: number
  orderLimit?: number
}

export interface CustomerSupportOverviewResponse {
  customerSupport: {
    products: Array<Pick<Product, 'id' | 'name' | 'price' | 'image'>>
    orders: Array<Pick<Order, 'id' | 'userId' | 'total' | 'status' | 'createdAt'>>
    users: Array<Pick<User, 'id' | 'role'>>
    reviews: Array<{ id: string; rating: number }>
  }
}

export interface CustomerSupportCustomerProfileVariables {
  userId: string
}

export interface CustomerSupportCustomerProfileResponse {
  customerSupport: {
    userContext: {
      user: User | null
      cart: Cart | null
      wishlist: Wishlist | null
      addresses: Address[]
    } | null
    orders: Order[]
    reviews: Review[]
  } | null
}
export interface CustomerSupportLogoutUserSessionsVariables {
  userId: string
}

export interface CustomerSupportLogoutUserSessionsResponse {
  customerSupport: {
    logoutUserSessions: boolean
  }
}

export interface CustomerSupportImpersonateUserVariables {
  userId: string
}

export interface CustomerSupportImpersonateUserResponse {
  customerSupport: {
    impersonateUser: {
      token: string
      expiresAt: string
    }
  }
}


export interface CustomerSupportCreateProductVariables {
  name: string
  price: number
  description?: string
  categoryId: string
  image?: ProductImageInput
}

export interface CustomerSupportCreateProductResponse {
  customerSupport: {
    addProduct: Product
  }
}

export interface CustomerSupportUpdateProductVariables {
  id: string
  name?: string
  price?: number
  description?: string
  categoryId?: string
  image?: ProductImageInput
  removeImage?: boolean
}

export interface CustomerSupportUpdateProductResponse {
  customerSupport: {
    updateProduct: Product
  }
}

export interface CustomerSupportDeleteProductVariables {
  id: string
}

export interface CustomerSupportDeleteProductResponse {
  customerSupport: {
    deleteProduct: boolean
  }
}

export interface CustomerSupportCreateUserVariables {
  email: string
  password: string
  name?: string
  role: UserRole
}

export interface CustomerSupportCreateUserResponse {
  customerSupport: {
    createUser: User
  }
}

export interface CustomerSupportUpdateUserVariables {
  id: string
  email?: string
  name?: string
  role?: UserRole
  password?: string
}

export interface CustomerSupportUpdateUserResponse {
  customerSupport: {
    updateUser: User
  }
}

export interface CustomerSupportDeleteUserVariables {
  id: string
}

export interface CustomerSupportDeleteUserResponse {
  customerSupport: {
    deleteUser: boolean
  }
}

export interface CustomerSupportUpdateOrderStatusVariables {
  orderId: string
  status: string
}

export interface CustomerSupportUpdateOrderStatusResponse {
  customerSupport: {
    updateOrderStatus: boolean
  }
}

export interface CustomerSupportCmsPagesVariables {
  status?: CmsStatus
  search?: string
}

export interface CustomerSupportCmsPagesResponse {
  customerSupport: {
    cmsPages: CmsPage[]
  }
}

export interface CustomerSupportCmsPageVariables {
  id?: string
  slug?: string
}

export interface CustomerSupportCmsPageResponse {
  customerSupport: {
    cmsPage: CmsPage | null
  }
}

export interface CustomerSupportCreateCmsPageVariables {
  input: {
    slug: string
    title: string
    excerpt?: string | null
    body: string
    status?: CmsStatus
    publishedAt?: string | null
  }
}

export interface CustomerSupportUpdateCmsPageVariables {
  id: string
  input: {
    slug?: string
    title?: string
    excerpt?: string | null
    body?: string
    status?: CmsStatus
    publishedAt?: string | null
  }
}

export interface CustomerSupportCmsPageMutationResponse {
  customerSupport: {
    createCmsPage?: CmsPage
    updateCmsPage?: CmsPage
    publishCmsPage?: CmsPage
    deleteCmsPage?: boolean
  }
}
