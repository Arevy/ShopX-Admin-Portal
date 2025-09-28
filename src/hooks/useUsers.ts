'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { useRootContext } from '@/stores/provider'
import { getUserFriendlyMessage } from '@/common/utils/getUserFriendlyMessage'
import { useTranslation } from '@/i18n'
import { UserRole } from '@/types/domain'

interface CreateUserFormState {
  email: string
  name: string
  password: string
  role: UserRole
}

type Feedback = {
  tone: 'positive' | 'negative'
  message: string
} | null

export const useUsers = () => {
  const rootContext = useRootContext()
  const { t } = useTranslation('Page_Admin_Users')
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
  const [feedback, setFeedback] = useState<Feedback>(null)

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
        setFeedback({ tone: 'negative', message: t('feedback.errors.missing_fields') })
        return
      }

      try {
        setCreating(true)
        await userStore.createUser(formState)
        setFormState({ email: '', name: '', password: '', role: 'SUPPORT' })
        setFeedback({ tone: 'positive', message: t('feedback.success.created') })
      } catch (error) {
        setFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('feedback.errors.create')),
        })
      } finally {
        setCreating(false)
      }
    },
    [userStore, formState, t],
  )

  const handleForceLogout = useCallback(
    async (userId: string) => {
      try {
        setFeedback(null)
        const revoked = await userStore.logoutUserSessions(userId)
        setFeedback({
          tone: 'positive',
          message: revoked ? t('feedback.success.sessions_revoked') : t('feedback.info.no_sessions'),
        })
      } catch (error) {
        setFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('feedback.errors.sessions_revoke')),
        })
      }
    },
    [userStore, t],
  )

  const handleImpersonate = useCallback(
    async (userId: string) => {
      setFeedback(null)
      try {
        const ticket = await userStore.impersonateUser(userId)
        if (!ticket) {
          throw new Error(t('feedback.errors.impersonation_ticket'))
        }

        if (typeof window === 'undefined') {
          throw new Error(t('feedback.errors.impersonation_browser'))
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3100'
        const impersonateUrl = `${baseUrl.replace(/\/$/, '')}/impersonate?token=${ticket.token}`
        window.open(impersonateUrl, '_blank', 'noopener')
        setFeedback({ tone: 'positive', message: t('feedback.success.impersonation') })
      } catch (error) {
        setFeedback({
          tone: 'negative',
          message: getUserFriendlyMessage(error, t('feedback.errors.impersonation')),
        })
      }
    },
    [userStore, t],
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
