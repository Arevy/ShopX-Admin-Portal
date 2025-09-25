'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { useStores } from '@/common/hooks/useStores'
import { UserRole } from '@/types/domain'

interface CreateUserFormState {
  email: string
  name: string
  password: string
  role: UserRole
}

export const useUsers = () => {
  const { rootContext } = useStores()
  const userStore = rootContext.userStore
  const [emailSearch, setEmailSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [formState, setFormState] = useState<CreateUserFormState>({
    email: '',
    name: '',
    password: '',
    role: 'SUPPORT',
  })
  const [creating, setCreating] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    void userStore.fetchUsers()
  }, [userStore])

  const handleSearch = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      void userStore.fetchUsers({
        email: emailSearch || undefined,
        role: (roleFilter || undefined) as UserRole | undefined,
      })
    },
    [userStore, emailSearch, roleFilter],
  )

  const handleCreate = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      setFeedback(null)
      if (!formState.email || !formState.password) {
        setFeedback('Email and password are required to create a user.')
        return
      }

      try {
        setCreating(true)
        await userStore.createUser(formState)
        setFormState({ email: '', name: '', password: '', role: 'SUPPORT' })
        setFeedback('User created and synced with backend!')
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Failed to create user.')
      } finally {
        setCreating(false)
      }
    },
    [userStore, formState],
  )

  const roleOptions = useMemo(() => ['CUSTOMER', 'SUPPORT'] as const, [])

  return {
    users: userStore.users,
    loading: userStore.loading,
    error: userStore.error,
    activeFilters: userStore.filters,
    handleSearch,
    handleCreate,
    emailSearch,
    setEmailSearch,
    roleFilter,
    setRoleFilter,
    formState,
    setFormState,
    creating,
    feedback,
    roleOptions,
  }
}
