import { useContext, useEffect } from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'

import { Route, Routes, useNavigate } from 'react-router-dom'
import { VaultItemSettings } from '@src/components/vault/ItemSettings'
import { VaultSettings } from './VaultSettings'

import Login from '@src/pages-vault/Login'
import { Center } from '@chakra-ui/react'
import Devices from './Devices'
import { VaultImportExport } from './VaultImportExport'
import Register from './Register'

import { AddItem } from './AddItem'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { VaultUnlockVerification } from '@src/pages/VaultUnlockVerification'
import { VaultList } from './VaultList'
import { AccountLimits } from './AccountLimits'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'

export function VaultRouter() {
  const { device, deviceState } = useContext(DeviceStateContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (device.lockedState) {
      navigate('verify')
    } else {
      navigate('/')
    }
    console.log('VaultRouter: useEffect')
  }, [device.lockedState])

  if (deviceState === null) {
    return (
      <Center marginX="50%" h="100vh">
        <Routes>
          <Route path="/" element={<Login />}></Route>
          <Route path="/signup" element={<Register />}></Route>
          <Route path="/verify" element={<VaultUnlockVerification />}></Route>
        </Routes>
      </Center>
    )
  }

  return (
    <SidebarWithHeader>
      <Routes>
        <Route path="/" element={<VaultList />}></Route>
        <Route
          path="/totp"
          element={<VaultList kind={EncryptedSecretType.TOTP} />}
        ></Route>
        <Route
          path="/loginCreds"
          element={<VaultList kind={EncryptedSecretType.LOGIN_CREDENTIALS} />}
        ></Route>
        <Route path="/secret/:secretId" element={<VaultItemSettings />} />
        <Route path="/account-limits" element={<AccountLimits />}></Route>
        <Route path="/settings/*" element={<VaultSettings />}></Route>
        <Route path="/devices" element={<Devices />}></Route>
        <Route path="/import-export" element={<VaultImportExport />}></Route>
        <Route path="/addItem" element={<AddItem />}></Route>
        <Route path="/devices" element={<Devices />}></Route>
      </Routes>
    </SidebarWithHeader>
  )
}
