import { useContext, useEffect, useState } from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'

import {
  Route,
  Routes,
  useNavigate,
  useLocation,
  Navigate
} from 'react-router-dom'
import { VaultItemSettings } from '@src/components/vault/VaultItemSettings'
import { VaultSettings } from './VaultSettings'

import { Center } from '@chakra-ui/react'
import { DevicesPage } from './DevicesPage'
import { VaultImportExport } from './VaultImportExport'
import Register from './Register'

import { AddItem } from './AddItem'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { UnlockDeviceForm } from '@src/pages/UnlockDeviceForm'
import { VaultList } from './VaultList'
import { AccountLimits } from './AccountLimits'
import debug from 'debug'
import Login from './Login'
import browser from 'webextension-polyfill'
import { ApolloProvider } from '@apollo/client'
import {
  apolloClient,
  apolloClientWithoutTokenRefresh
} from '@src/apollo/apolloClient'
import { NewDevicePolicyOnboarding } from './NewDevicePolicyOnboarding'

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
  }, [lockedState])

  useEffect(() => {
    browser.storage.sync.get('vaultTableView').then((res) => {
      setVaultTableView(res.vaultTableView as boolean)
    })

    browser.storage.sync.onChanged.addListener((changes) => {
      if (changes.vaultTableView) {
        setVaultTableView(changes.vaultTableView.newValue as boolean)
      }
    })
  }, [])

  if (deviceState === null) {
    return (
      <ApolloProvider client={apolloClientWithoutTokenRefresh}>
        <Center marginX="50%" h="100vh">
          <Routes>
            <Route path="/" element={<Login />}></Route>
            <Route path="/signup" element={<Register />}></Route>
            <Route
              path="/verify"
              element={
                <UnlockDeviceForm
                  onUnlocked={() => {
                    navigate('/')
                  }}
                />
              }
            ></Route>
          </Routes>
        </Center>
      </ApolloProvider>
    )
  }

  return (
    <ApolloProvider client={apolloClient}>
      <SidebarWithHeader>
        <Routes>
          <Route
            path="/"
            element={<VaultList tableView={vaultTableView} />}
          ></Route>
          <Route
            path="/credentials"
            element={<VaultList tableView={vaultTableView} />}
          ></Route>
          <Route
            path="/totps"
            element={<VaultList tableView={vaultTableView} />}
          ></Route>
          <Route path="/secret/:secretId" element={<VaultItemSettings />} />
          <Route path="/account-limits" element={<AccountLimits />}></Route>
          <Route path="/settings/*" element={<VaultSettings />}></Route>
          <Route path="/devices" element={<DevicesPage />}></Route>
          <Route path="/import-export" element={<VaultImportExport />}></Route>
          <Route path="/addItem" element={<AddItem />}></Route>
        </Routes>
      </SidebarWithHeader>
      <NewDevicePolicyOnboarding />
    </ApolloProvider>
  )
}
