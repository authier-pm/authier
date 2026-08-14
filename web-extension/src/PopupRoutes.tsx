import { ReactElement, useContext } from 'react'
import { openVaultTab } from './AuthLinkPage'
import { Popup } from './popup/Popup'
import { DeviceStateContext } from './providers/DeviceStateProvider'
import { UnlockDeviceForm } from './pages/UnlockDeviceForm'
import Login from './components/auth/Login'
import debug from 'debug'
import { useLocation } from 'wouter'
const log = debug('au:popupRoutes')

export default function PopupRoutes(): ReactElement {
  const { deviceState, isInitialized, lockedState } =
    useContext(DeviceStateContext)

  const [, setLocation] = useLocation()

  log('deviceState', deviceState, lockedState)

  if (!isInitialized) {
    return (
      <div className="flex min-h-[220px] w-[350px] max-w-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-primary)]" />
      </div>
    )
  }

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

  if (deviceState === null) {
    return (
      <div className="flex min-h-[360px] w-full items-center justify-center overflow-x-hidden p-3">
        <Login
          compact
          onSignUp={() => {
            openVaultTab('/signup')
          }}
        />
      </div>
    )
  }

  return <Popup />
}
