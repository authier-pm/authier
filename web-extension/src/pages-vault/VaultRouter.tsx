import React, { useEffect } from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'
import { ItemList } from '@src/pages-vault/ItemList'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { VaultItemSettings } from '@src/components/vault/ItemSettings'
import { VaultSettings } from './VaultSettings'
import { device } from '@src/background/ExtensionDevice'
import Login from '@src/pages-vault/Login'
import { Center } from '@chakra-ui/react'
import Premium from './Premium'
import Devices from './Devices'
import { VaultImportExport } from './VaultImportExport'
import Register from './Register'
import { VaultUnlockVerification } from '@src/pages/VaultUnlockVerification'
import { AddItem } from './AddItem'

export function VaultRouter() {
  const navigate = useNavigate()

  useEffect(() => {
    if (device.lockedState) {
      navigate('/verify')
    }
  }, [device.lockedState])

  if (device.state === null) {
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
        <Route path="/" element={<ItemList />}></Route>
        <Route path="/secret/:secretId" element={<VaultItemSettings />} />
        <Route path="/account-limits" element={<Premium />}></Route>
        <Route path="/settings/*" element={<VaultSettings />}></Route>
        <Route path="/devices" element={<Devices />}></Route>
        <Route path="/import-export" element={<VaultImportExport />}></Route>
        <Route path="/addItem" element={<AddItem />}></Route>
        <Route path="/devices" element={<Devices />}></Route>
      </Routes>
    </SidebarWithHeader>
  )
}
