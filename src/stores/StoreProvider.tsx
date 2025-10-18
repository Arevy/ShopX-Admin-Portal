'use client'

import { ReactNode, createContext, useContext, useRef } from 'react'

import { RootStore, createRootStore } from '@/stores/rootStore'

const RootStoreContext = createContext<RootStore | null>(null)

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const rootStoreRef = useRef<RootStore>()

  if (!rootStoreRef.current) {
    rootStoreRef.current = createRootStore()
  }

  return (
    <RootStoreContext.Provider value={rootStoreRef.current}>
      {children}
    </RootStoreContext.Provider>
  )
}

export const useRootStore = () => {
  const rootStore = useContext(RootStoreContext)
  if (!rootStore) {
    throw new Error('useRootStore must be used within a StoreProvider')
  }

  return rootStore
}

export const useRootContext = useRootStore
export const useStore = useRootStore
