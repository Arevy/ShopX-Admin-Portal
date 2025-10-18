import type { NextPage } from 'next'

import LoginPage from './LoginPage'

const LoginRoute: NextPage & { useAppShell?: boolean } = () => {
  return <LoginPage />
}

LoginRoute.useAppShell = false

export default LoginRoute
