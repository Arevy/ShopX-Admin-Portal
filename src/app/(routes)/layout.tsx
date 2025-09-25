import { ReactNode } from 'react'
import { AppShell } from '@/components/AppShell'

export default function RoutesLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
