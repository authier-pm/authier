import { useContext, useEffect } from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'

import { Route, Routes, useNavigate } from 'react-router-dom'
import { VaultItemSettings } from '@src/components/vault/VaultItemSettings'
import { VaultSettings } from './VaultSettings'

import { Center } from '@chakra-ui/react'
import Devices from './Devices'
import { VaultImportExport } from './VaultImportExport'
import Register from './Register'

import { AddItem } from './AddItem'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { UnlockDeviceForm } from '@src/pages/UnlockDeviceForm'
import { VaultList } from './VaultList'
import { AccountLimits } from './AccountLimits'
import debug from 'debug'
import Login from './Login'
import DefaultSettings from './DefaultSettings'

const log = debug('au:VaultRouter')

export function VaultRouter() {
  const { deviceState, lockedState } = useContext(DeviceStateContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (lockedState) {
      navigate('verify')
    }
    log('VaultRouter: deviceState', deviceState, lockedState)
  }, [lockedState])

  if (deviceState === null) {
    return (
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
    )
  }

  if (deviceState.firstTimeUser) {
    return <DefaultSettings />
  }

  return (
    <SidebarWithHeader>
      <Routes>
        <Route path="/" element={<VaultList />}></Route>
        <Route path="/secret/:secretId" element={<VaultItemSettings />} />
        <Route path="/account-limits" element={<AccountLimits />}></Route>
        <Route path="/settings/*" element={<VaultSettings />}></Route>
        <Route path="/devices" element={<Devices />}></Route>
        <Route path="/import-export" element={<VaultImportExport />}></Route>
        <Route path="/addItem" element={<AddItem />}></Route>
      </Routes>
    </SidebarWithHeader>
  )
}
