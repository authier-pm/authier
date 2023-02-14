import { ReactElement, useContext } from 'react'
import { AuthLinkPage } from './AuthLinkPage'
import { VaultUnlockVerification } from './pages/VaultUnlockVerification'
import { Popup } from './popup/Popup'
import { DeviceStateContext } from './providers/DeviceStateProvider'
import debug from 'debug'
const log = debug('au:popupRoutes')

export default function PopupRoutes(): ReactElement {
  const { deviceState, lockedState } = useContext(DeviceStateContext)

  log('deviceState', deviceState, lockedState)

  if (lockedState) {
    return <VaultUnlockVerification />
  }

  if (deviceState === null) {
    return <AuthLinkPage />
  }

  return <Popup />
}
