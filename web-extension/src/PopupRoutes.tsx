import { ReactElement, useContext } from 'react'
import { AuthLinkPage } from './AuthLinkPage'
import { Popup } from './popup/Popup'
import { DeviceStateContext } from './providers/DeviceStateProvider'
import { UnlockDeviceForm } from './pages/UnlockDeviceForm'
import debug from 'debug'
import { useLocation } from 'wouter'
import { Spinner } from '@chakra-ui/react'
const log = debug('au:popupRoutes')

export default function PopupRoutes(): ReactElement {
  const { deviceState, lockedState, isInitialized } =
    useContext(DeviceStateContext)

  const [, setLocation] = useLocation()

  log('deviceState', deviceState, lockedState)

  if (lockedState) {
    // TODO this would be nice, but we cannot reuse VaultUnlockVerification because it depends on react-router and stuff
    return (
      <UnlockDeviceForm
        onUnlocked={() => {
          setLocation('/')
        }}
      />
    )
  }

  // if (isInitialized === false) { // TODO this is not correct when user is logged out
  //   return <Spinner />
  // }

  if (deviceState === null) {
    return <AuthLinkPage />
  }

  return <Popup />
}
