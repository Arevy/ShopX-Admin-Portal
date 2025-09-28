'use client'

import { ReactNode } from 'react'
import { TranslationProvider } from '@/i18n'
import { StoreProvider } from '@/stores/provider'

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <TranslationProvider>
      <StoreProvider>{children}</StoreProvider>
    </TranslationProvider>
  )
}
