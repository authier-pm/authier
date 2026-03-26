import { useContext, useEffect, useState } from 'react'
import {
  Route,
  Routes,
  useNavigate,
  useLocation
} from 'react-router-dom'
import debug from 'debug'
import browser from 'webextension-polyfill'
import { ApolloProvider } from '@apollo/client/react'
import { apolloClient, apolloClientWithoutTokenRefresh } from '@src/apollo/apolloClient'
import { VaultItemSettings } from '@src/components/vault/VaultItemSettings'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'
import { VaultSettings } from './VaultSettings'
import { DevicesPage } from './DevicesPage'
import { VaultImportExport } from './VaultImportExport'
import Register from './Register'
import { AddItem } from './AddItem'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { UnlockDeviceForm } from '@src/pages/UnlockDeviceForm'
import { VaultList } from './VaultList'
import { AccountLimits } from './AccountLimits'
import Login from './Login'
import { NewDevicePolicyOnboarding } from './NewDevicePolicyOnboarding'
import { PasswordGenerationHistory } from './PasswordGenerationHistory'

const log = debug('au:VaultRouter')

export function VaultRouter() {
  const { deviceState, lockedState } = useContext(DeviceStateContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [vaultTableView, setVaultTableView] = useState(false)

  useEffect(() => {
    if (lockedState) {
      navigate('verify')
    }
    log('VaultRouter: deviceState', deviceState, lockedState)
  }, [deviceState, lockedState, navigate])

  useEffect(() => {
    browser.storage.sync.get('vaultTableView').then((res) => {
      setVaultTableView(res.vaultTableView as boolean)
    })

    const handleStorageChange = (changes: Record<string, browser.Storage.StorageChange>) => {
      if (changes.vaultTableView) {
        setVaultTableView(changes.vaultTableView.newValue as boolean)
      }
    }

    browser.storage.sync.onChanged.addListener(handleStorageChange)

    return () => {
      browser.storage.sync.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  if (deviceState === null) {
    return (
      <ApolloProvider client={apolloClientWithoutTokenRefresh}>
        <div className="flex min-h-screen items-center justify-center px-4">
          <Routes>
            <Route element={<Login />} path="/" />
            <Route element={<Register />} path="/signup" />
            <Route
              element={
                <UnlockDeviceForm
                  onUnlocked={() => {
                    navigate('/')
                  }}
                />
              }
              path="/verify"
            />
          </Routes>
        </div>
      </ApolloProvider>
    )
  }

  return (
    <ApolloProvider client={apolloClient}>
      <SidebarWithHeader>
        <Routes key={location.pathname}>
          <Route element={<VaultList tableView={vaultTableView} />} path="/" />
          <Route element={<VaultList tableView={vaultTableView} />} path="/credentials" />
          <Route element={<VaultList tableView={vaultTableView} />} path="/totps" />
          <Route element={<VaultItemSettings />} path="/secret/:secretId" />
          <Route element={<AccountLimits />} path="/account-limits" />
          <Route element={<VaultSettings />} path="/settings/*" />
          <Route element={<DevicesPage />} path="/devices" />
          <Route element={<VaultImportExport />} path="/import-export" />
          <Route element={<PasswordGenerationHistory />} path="/password-generation-history" />
          <Route element={<AddItem />} path="/addItem" />
        </Routes>
      </SidebarWithHeader>
      <NewDevicePolicyOnboarding />
    </ApolloProvider>
  )
}
