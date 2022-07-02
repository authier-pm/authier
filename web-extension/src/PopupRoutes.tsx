import React, { ReactElement, useContext } from 'react'
import { AuthLinkPage } from './AuthLinkPage'
import { device } from './background/ExtensionDevice'
import { VaultUnlockVerification } from './pages/VaultUnlockVerification'
import { Popup } from './popup/Popup'
import { DeviceStateContext } from './providers/DeviceStateProvider'

export default function PopupRoutes(): ReactElement {
  const { deviceState, safeLocked } = useContext(DeviceStateContext)
  // console.log('~ backgroundState', deviceState)
  // console.log('~ safeLocked', safeLocked)

  if (safeLocked) {
    return <VaultUnlockVerification />
  }
  if (!deviceState) {
    return <AuthLinkPage />
  }

  return <Popup />
}
