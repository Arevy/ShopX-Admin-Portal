import { ReactNode } from 'react'
import { AppShell } from '@/components/AppShell'
import { SupportSessionGuard } from '@/components/SupportSessionGuard'

export default function RoutesLayout({ children }: { children: ReactNode }) {
  return (
    <SupportSessionGuard>
      <AppShell>{children}</AppShell>
    </SupportSessionGuard>
  )
}
