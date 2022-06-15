import React, { ReactElement, useContext } from 'react'
import { AuthLinkPage } from './AuthLinkPage'
import { device } from './background/ExtensionDevice'
import { VaultUnlockVerification } from './pages/VaultUnlockVerification'
import { Popup } from './popup/Popup'
import { DeviceStateContext } from './providers/DeviceStateProvider'

export default function PopupRoutes(): ReactElement {
  const { deviceState } = useContext(DeviceStateContext)
  console.log('~ backgroundState', deviceState)

  if (device.lockedState) {
    return <VaultUnlockVerification />
  }
  if (!deviceState) {
    return <AuthLinkPage />
  }

  return <Popup />
}
