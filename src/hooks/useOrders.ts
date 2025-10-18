'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { useRootContext } from '@/stores/StoreProvider'
import { getUserFriendlyMessage } from '@/lib/getUserFriendlyMessage'
import { useTranslation } from '@/i18n'

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

type Feedback = {
  tone: 'positive' | 'negative'
  message: string
} | null

export const useOrders = () => {
  const rootContext = useRootContext()
  const { t } = useTranslation('Page_Admin_Orders')
  const userStore = rootContext.userStore
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    void userStore.fetchOrders()
  }, [userStore])

  const handleFilter = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      void userStore.fetchOrders({
        status: statusFilter || undefined,
        userId: userIdFilter || undefined,
        offset: 0,
      })
    },
    [userStore, statusFilter, userIdFilter],
  )

  const handleStatusChange = useCallback(
    async (orderId: string, status: string) => {
      setPending((prev) => ({ ...prev, [orderId]: true }))
      setFeedback(null)
      try {
        await userStore.updateOrderStatus(orderId, status)
        const statusLabel = t(`statuses.${status.toLowerCase()}`)
        setFeedback({
          tone: 'positive',
          message: t('feedback.success.update', {
            id: orderId,
            status: statusLabel === `statuses.${status.toLowerCase()}` ? status : statusLabel,
          }),
        })
      } catch (error) {
        setFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('feedback.errors.update')),
        })
      } finally {
        setPending((prev) => ({ ...prev, [orderId]: false }))
      }
    },
    [userStore, t],
  )

  const state = useMemo(
    () => ({
      orders: userStore.orders,
      loading: userStore.ordersLoading,
      error: userStore.ordersError,
    }),
    [userStore.orders, userStore.ordersLoading, userStore.ordersError],
  )

  const limit = userStore.orderLimit
  const offset = userStore.orderOffset
  const total = userStore.ordersTotal
  const currentPage = userStore.orderCurrentPage
  const totalPages = userStore.orderTotalPages
  const hasPreviousPage = offset > 0
  const hasNextPage = offset + userStore.orders.length < total
  const start = total === 0 ? 0 : offset + 1
  const end = offset + userStore.orders.length

  return {
    ...state,
    activeFilters: userStore.orderFilters,
    statusOptions: STATUS_OPTIONS,
    statusFilter,
    setStatusFilter,
    userIdFilter,
    setUserIdFilter,
    handleFilter,
    handleStatusChange,
    pending,
    feedback,
    pagination: {
      limit,
      offset,
      total,
      currentPage,
      totalPages,
      hasPreviousPage,
      hasNextPage,
      start,
      end,
      goToPage: (page: number) => userStore.goToOrderPage(page),
      goToNextPage: () => userStore.nextOrderPage(),
      goToPreviousPage: () => userStore.previousOrderPage(),
    },
  }
}
