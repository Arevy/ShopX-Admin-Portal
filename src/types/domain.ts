export type UserRole = 'CUSTOMER' | 'SUPPORT'

export interface Category {
  id: string
  name: string
  description?: string | null
}

export interface Product {
  id: string
  name: string
  price: number
  description?: string | null
  categoryId?: string | null
  category?: Category | null
}

export interface OrderProduct {
  productId: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  userId: string
  total: number
  status: string
  createdAt?: string | null
  updatedAt?: string | null
  products: OrderProduct[]
}

export interface User {
  id: string
  email: string
  name?: string | null
  role: UserRole
}

export interface Address {
  id: string
  userId: string
  street: string
  city: string
  postalCode: string
  country: string
}

export interface CartItem {
  quantity: number
  product: Product
}

export interface Cart {
  userId: string
  items: CartItem[]
  total: number
}

export interface Wishlist {
  userId: string
  products: Product[]
}

export interface Review {
  id: string
  productId: string
  rating: number
  reviewText?: string | null
  createdAt: string
}

export interface SupportMetrics {
  totalRevenue: number
  orders: number
  products: number
  customers: number
  averageRating: number | null
}

export interface CustomerProfile {
  user: User | null
  orders: Order[]
  addresses: Address[]
  cart: Cart | null
  wishlist: Wishlist | null
  reviews: Review[]
}
