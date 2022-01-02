import React, { ReactElement, useContext } from 'react'
import { VaultRouter } from './pages-vault/VaultRouter'
import { VaultUnlockVerification } from './pages/VaultUnlockVerification'
import { BackgroundContext } from './providers/BackgroundProvider'

export function VaultRoutes(): ReactElement {
  const { backgroundState } = useContext(BackgroundContext)

  return <VaultRouter />
}
