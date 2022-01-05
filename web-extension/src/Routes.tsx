import { Flex, Spinner } from '@chakra-ui/react'
import React, { ReactElement, useContext, useEffect } from 'react'
import browser from 'webextension-polyfill'
import AuthPages from './AuthPages'
import { device } from './background/ExtensionDevice'
import { VaultUnlockVerification } from './pages/VaultUnlockVerification'
import { Popup } from './popup/Popup'
import { DeviceStateContext } from './providers/DeviceStateProvider'

export default function Routes(): ReactElement {
  const { deviceState } = useContext(DeviceStateContext)
  console.log('~ backgroundState', deviceState)

  if (device.lockedState) {
    return <VaultUnlockVerification />
  }
  if (!deviceState) {
    return <AuthPages />
  }

  return <Popup />
}
