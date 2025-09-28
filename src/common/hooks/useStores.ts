'use client';

import { useRootContext } from '@/stores/provider'

export function useStores() {
  const rootContext = useRootContext()
  return { rootContext }
}
