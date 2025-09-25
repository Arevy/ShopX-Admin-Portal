'use client'

import React, { createContext, useContext, useRef, ReactNode } from 'react'

import RootContext from '@/common/stores/RootContext'

const RootContextReact = createContext<RootContext | null>(null)

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const rootContextRef = useRef<RootContext | null>(null)

  if (rootContextRef.current === null) {
    rootContextRef.current = new RootContext()
  }

  return (
    <RootContextReact.Provider value={rootContextRef.current}>
      {children}
    </RootContextReact.Provider>
  )
}

export const useRootContext = () => {
  const rootContext = useContext(RootContextReact)
  if (!rootContext) {
    throw new Error('useRootContext must be used within a StoreProvider')
  }

  return rootContext
}

export const useStore = () => {
  return useRootContext()
}
