import type { AppProps } from 'next/app'
import '@styles/globals.scss'

import { AppShell } from '@/components/AppShell'
import { Providers } from '@/components/Providers'
import { SupportSessionGuard } from '@/components/SupportSessionGuard'

type AppPage = AppProps['Component'] & {
  useAppShell?: boolean
}

const App = ({ Component, pageProps }: AppProps) => {
  const PageComponent = Component as AppPage
  const requiresAppShell = PageComponent.useAppShell ?? true

  const content = requiresAppShell ? (
    <SupportSessionGuard>
      <AppShell>
        <Component {...pageProps} />
      </AppShell>
    </SupportSessionGuard>
  ) : (
    <Component {...pageProps} />
  )

  return <Providers>{content}</Providers>
}

export default App
