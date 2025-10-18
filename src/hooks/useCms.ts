"use client";

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { useRootContext } from '@/stores/StoreProvider'

export const useCms = () => {
  const rootContext = useRootContext()
  const { cmsStore } = rootContext

  useEffect(() => {
    if (!cmsStore.pages.length && !cmsStore.loading) {
      cmsStore.fetchPages()
    }
  }, [cmsStore])

  return cmsStore
}

export const withCmsObserver = <T extends object>(component: (props: T) => JSX.Element) =>
  observer(component)
