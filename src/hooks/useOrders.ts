'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { useStores } from '@/common/hooks/useStores'

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

export const useOrders = () => {
  const { rootContext } = useStores()
  const orderStore = rootContext.orderStore
  const [statusFilter, setStatusFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<string | null>(null)

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
        setFeedback(`Order ${orderId} updated to ${status}.`)
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : 'Failed to update order status in backend.',
        )
      } finally {
        setPending((prev) => ({ ...prev, [orderId]: false }))
      }
    },
    [orderStore],
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
