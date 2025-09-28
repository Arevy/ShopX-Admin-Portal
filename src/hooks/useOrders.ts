'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { useRootContext } from '@/stores/provider'
import { getUserFriendlyMessage } from '@/common/utils/getUserFriendlyMessage'
import { useTranslation } from '@/i18n'

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

type Feedback = {
  tone: 'positive' | 'negative'
  message: string
} | null

export const useOrders = () => {
  const rootContext = useRootContext()
  const { t } = useTranslation('Page_Admin_Orders')
  const orderStore = rootContext.orderStore
  const [statusFilter, setStatusFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    void orderStore.fetchOrders()
  }, [orderStore])

  const handleFilter = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      void orderStore.fetchOrders({
        status: statusFilter || undefined,
        userId: userIdFilter || undefined,
      })
    },
    [orderStore, statusFilter, userIdFilter],
  )

  const handleStatusChange = useCallback(
    async (orderId: string, status: string) => {
      setPending((prev) => ({ ...prev, [orderId]: true }))
      setFeedback(null)
      try {
        await orderStore.updateOrderStatus(orderId, status)
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
    [orderStore, t],
  )

  const state = useMemo(
    () => ({
      orders: orderStore.orders,
      loading: orderStore.loading,
      error: orderStore.error,
    }),
    [orderStore.orders, orderStore.loading, orderStore.error],
  )

  return {
    ...state,
    activeFilters: orderStore.filters,
    statusOptions: STATUS_OPTIONS,
    statusFilter,
    setStatusFilter,
    userIdFilter,
    setUserIdFilter,
    handleFilter,
    handleStatusChange,
    pending,
    feedback,
  }
}
