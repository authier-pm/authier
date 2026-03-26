import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { useVaultSession } from '@/providers/VaultSessionProvider'
import { AwaitingApprovalPage } from '@/routes/AwaitingApprovalPage'
import { DevicesPage } from '@/routes/DevicesPage'
import { HomeRedirect } from '@/routes/HomeRedirect'
import { LoginPage } from '@/routes/LoginPage'
import { RegisterPage } from '@/routes/RegisterPage'
import { SecurityPage } from '@/routes/SecurityPage'
import { UnlockPage } from '@/routes/UnlockPage'
import { VaultEditPage } from '@/routes/VaultEditPage'
import { VaultListPage } from '@/routes/VaultListPage'

function ProtectedArea() {
  const { status } = useVaultSession()

  if (status === 'locked') {
    return <Navigate replace to="/unlock" />
  }

  if (status !== 'authenticated') {
    return <Navigate replace to="/login" />
  }

  return (
    <AppShell>
      <Routes>
        <Route element={<VaultListPage />} path="/vault" />
        <Route
          element={<VaultListPage initialFilterMode="LOGIN_CREDENTIALS" />}
          path="/vault/passwords"
        />
        <Route
          element={<VaultListPage initialFilterMode="TOTP" />}
          path="/vault/totp"
        />
        <Route element={<VaultEditPage />} path="/vault/new" />
        <Route element={<VaultEditPage />} path="/vault/:secretId" />
        <Route element={<DevicesPage />} path="/devices" />
        <Route element={<SecurityPage />} path="/security" />
      </Routes>
    </AppShell>
  )
}

export function App() {
  return (
    <Routes>
      <Route element={<HomeRedirect />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
      <Route element={<AwaitingApprovalPage />} path="/awaiting-approval" />
      <Route element={<UnlockPage />} path="/unlock" />
      <Route element={<ProtectedArea />} path="/*" />
    </Routes>
  )
}
