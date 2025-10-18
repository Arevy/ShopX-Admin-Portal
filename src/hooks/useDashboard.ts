'use client'

import { useEffect, useMemo } from 'react'

import { useRootContext } from '@/stores/StoreProvider'

export const useDashboard = () => {
  const rootContext = useRootContext()
  const supportStore = rootContext.supportStore
  const userStore = rootContext.userStore

  useEffect(() => {
    void supportStore.loadOverview()
    void userStore.fetchOrders({ limit: 5 })
    void userStore.fetchUsers()
  }, [supportStore, userStore])

  const recentOrders = useMemo(() => userStore.orders.slice(0, 5), [userStore.orders])
  const topCustomers = useMemo(() => userStore.users.slice(0, 6), [userStore.users])

  return {
    metrics: supportStore.metrics,
    recentOrders,
    topCustomers,
    loading: supportStore.overviewLoading,
    error: supportStore.overviewError,
  }
}
