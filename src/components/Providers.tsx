'use client'

import { ReactNode } from 'react'
import { StoreProvider } from '@/stores/provider'

export const Providers = ({ children }: { children: ReactNode }) => {
  return <StoreProvider>{children}</StoreProvider>
}
