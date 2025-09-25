'use client'

import { FormEvent, useCallback, useState } from 'react'

import { useStores } from '@/common/hooks/useStores'

export const useSupportDesk = () => {
  const { rootContext } = useStores()
  const supportStore = rootContext.supportStore
  const [userId, setUserId] = useState('')

  const handleLookup = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      if (!userId) {
        return
      }
      void supportStore.loadCustomerProfile(userId)
    },
    [supportStore, userId],
  )

  const clearProfile = useCallback(() => {
    supportStore.resetCustomerProfile()
  }, [supportStore])

  return {
    userId,
    setUserId,
    handleLookup,
    clearProfile,
    loading: supportStore.profileLoading,
    error: supportStore.profileError,
    customer: supportStore.customerProfile,
  }
}
