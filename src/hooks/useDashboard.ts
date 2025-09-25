'use client'

import { useEffect, useMemo } from 'react'

import { useStores } from '@/common/hooks/useStores'

export const useDashboard = () => {
  const { rootContext } = useStores()
  const supportStore = rootContext.supportStore
  const orderStore = rootContext.orderStore
  const userStore = rootContext.userStore

  useEffect(() => {
    void supportStore.loadOverview()
    void orderStore.fetchOrders({ limit: 5 })
    void userStore.fetchUsers()
  }, [supportStore, orderStore, userStore])

  const recentOrders = useMemo(() => orderStore.orders.slice(0, 5), [orderStore.orders])
  const topCustomers = useMemo(() => userStore.users.slice(0, 6), [userStore.users])

  return {
    metrics: supportStore.metrics,
    recentOrders,
    topCustomers,
    loading: supportStore.overviewLoading,
    error: supportStore.overviewError,
  }
}
