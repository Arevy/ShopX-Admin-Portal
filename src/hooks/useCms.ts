import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { useStore } from '@/stores/provider'

export const useCms = () => {
  const { cmsStore } = useStore()

  useEffect(() => {
    if (!cmsStore.pages.length && !cmsStore.loading) {
      cmsStore.fetchPages()
    }
  }, [cmsStore])

  return cmsStore
}

export const withCmsObserver = <T extends object>(component: (props: T) => JSX.Element) =>
  observer(component)
