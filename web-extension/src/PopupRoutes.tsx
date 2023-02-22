import { ReactElement, useContext } from 'react'
import { AuthLinkPage } from './AuthLinkPage'
import { Popup } from './popup/Popup'
import { DeviceStateContext } from './providers/DeviceStateProvider'
import debug from 'debug'
const log = debug('au:popupRoutes')

export default function PopupRoutes(): ReactElement {
  const { deviceState, lockedState } = useContext(DeviceStateContext)

  log('deviceState', deviceState, lockedState)

  // if (lockedState) { // TODO this would be nice, but we cannot reuse VaultUnlockVerification because it depends on react-router and stuff
  //   return <VaultUnlockVerification />
  // }

  if (lockedState || deviceState === null) {
    return <AuthLinkPage />
  }

  return <Popup />
}
