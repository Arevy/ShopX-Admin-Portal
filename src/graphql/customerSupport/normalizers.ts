import type { CustomerSupportOrdersVariables, CustomerSupportUsersVariables } from '@/types/graphql'
import type { Order, OrderProduct, User } from '@/types/domain'

export const INVALID_USER_ID_MESSAGE = 'User ID filters accept only numeric identifiers.'

type RawOrder = {
  id?: unknown
  userId?: unknown
  total?: unknown
  status?: unknown
  createdAt?: string | null
  updatedAt?: string | null
  products?: Array<{
    productId?: unknown
    quantity?: unknown
    price?: unknown
  }>
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
}

export const normalizeOrderVariables = (
  variables?: CustomerSupportOrdersVariables,
): {
  sanitized: CustomerSupportOrdersVariables
  errorMessage?: string
} => {
  const rawLimit = variables?.limit
  const parsedLimit = Number(rawLimit)
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(100, Math.floor(parsedLimit)) : 20

  const rawOffset = variables?.offset
  const parsedOffset = Number(rawOffset)
  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? Math.floor(parsedOffset) : 0

  const status = variables?.status?.trim()
  const normalizedStatus = status ? status.toUpperCase() : undefined

  const rawUserId = variables?.userId?.trim()
  let normalizedUserId: string | undefined
  if (rawUserId) {
    if (/^\d+$/.test(rawUserId)) {
      normalizedUserId = rawUserId
    } else {
      return {
        sanitized: {
          limit,
          offset,
          status: normalizedStatus,
        },
        errorMessage: INVALID_USER_ID_MESSAGE,
      }
    }
  }

  const sanitized: CustomerSupportOrdersVariables = {
    limit,
    offset,
  }

  if (normalizedStatus) {
    sanitized.status = normalizedStatus
  }

  if (normalizedUserId) {
    sanitized.userId = normalizedUserId
  }

  return {
    sanitized,
  }
}

export const normalizeOrdersDataset = (
  orders: Array<RawOrder | Order> | undefined,
  variables: CustomerSupportOrdersVariables,
): Order[] => {
  const normalizedStatusFilter = variables.status ?? null
  const normalizedUserIdFilter = variables.userId ?? null

  const dataset = orders ?? []

  return dataset
    .filter((order) => {
      const status = String((order as Order).status ?? '').toUpperCase()
      const userId = String((order as Order).userId ?? '')

      if (normalizedStatusFilter && status !== normalizedStatusFilter) {
        return false
      }

      if (normalizedUserIdFilter && userId !== normalizedUserIdFilter) {
        return false
      }

      return true
    })
    .map<Order>((order) => {
      const products: OrderProduct[] = (order.products ?? []).map((product) => ({
        productId: String((product as OrderProduct).productId ?? ''),
        quantity: toNumber((product as OrderProduct).quantity),
        price: toNumber((product as OrderProduct).price),
      }))

      return {
        id: String(order.id ?? ''),
        userId: toStringOrNull((order as Order).userId) ?? '',
        total: toNumber((order as Order).total),
        status: String((order as Order).status ?? ''),
        createdAt: (order as Order).createdAt ?? null,
        updatedAt: (order as Order).updatedAt ?? null,
        products,
      }
    })
}

export const normalizeUserVariables = (
  variables?: CustomerSupportUsersVariables,
): CustomerSupportUsersVariables => {
  const email = variables?.email?.trim()
  return {
    email: email || undefined,
    role: variables?.role ?? undefined,
  }
}

export const normalizeUsersDataset = (
  users: Array<Partial<User>> | undefined,
): User[] => {
  return (users ?? []).map((user) => ({
    id: String(user.id ?? ''),
    email: String(user.email ?? ''),
    name: user.name ?? null,
    role: user.role ?? 'SUPPORT',
  }))
}
