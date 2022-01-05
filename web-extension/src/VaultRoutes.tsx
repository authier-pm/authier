import React, { ReactElement, useContext } from 'react'
import { VaultRouter } from './pages-vault/VaultRouter'
import { VaultUnlockVerification } from './pages/VaultUnlockVerification'
import { DeviceStateContext } from './providers/DeviceStateProvider'

export function VaultRoutes(): ReactElement {
  const { deviceState } = useContext(DeviceStateContext)

  return <VaultRouter />
}
