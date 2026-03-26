import { Navigate } from 'react-router-dom'
import { useVaultSession } from '@/providers/VaultSessionProvider'

export function HomeRedirect() {
  const { pendingLogin, status } = useVaultSession()

  if (status === 'authenticated') {
    return <Navigate to="/vault" replace />
  }

  if (status === 'locked') {
    return <Navigate to="/unlock" replace />
  }

  if (pendingLogin) {
    return <Navigate to="/awaiting-approval" replace />
  }

  return <Navigate to="/login" replace />
}
