'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { useStores } from '@/common/hooks/useStores'
import { getUserFriendlyMessage } from '@/common/utils/getUserFriendlyMessage'
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
        setFeedback(
          getUserFriendlyMessage(error, 'Failed to create user.'),
        )
      } finally {
        setCreating(false)
      }
    },
    [userStore, formState],
  )

  const handleForceLogout = useCallback(
    async (userId: string) => {
      try {
        setFeedback(null)
        const revoked = await userStore.logoutUserSessions(userId)
        setFeedback(
          revoked
            ? 'All active sessions for this user were revoked.'
            : 'No active sessions were found for this user.',
        )
      } catch (error) {
        setFeedback(
          getUserFriendlyMessage(
            error,
            'Failed to revoke user sessions. Please retry.',
          ),
        )
      }
    },
    [userStore],
  )

  const handleImpersonate = useCallback(
    async (userId: string) => {
      setFeedback(null)
      try {
        const ticket = await userStore.impersonateUser(userId)
        if (!ticket) {
          throw new Error('Unable to generate an impersonation ticket.')
        }

        if (typeof window === 'undefined') {
          throw new Error('Impersonation requires a browser environment.')
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3100'
        const impersonateUrl = `${baseUrl.replace(/\/$/, '')}/impersonate?token=${ticket.token}`
        window.open(impersonateUrl, '_blank', 'noopener')
        setFeedback('Impersonation window opened in a new tab.')
      } catch (error) {
        setFeedback(
          getUserFriendlyMessage(
            error,
            'Failed to start impersonation. Please retry.',
          ),
        )
      }
    },
    [userStore],
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
    handleForceLogout,
    handleImpersonate,
  }
}
