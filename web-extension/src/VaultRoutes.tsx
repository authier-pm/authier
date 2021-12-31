import React, { ReactElement, useContext } from 'react'
import { Vault } from './pages-vault/Vault'
import { VaultUnlockVerification } from './pages/VaultUnlockVerification'
import { BackgroundContext } from './providers/BackgroundProvider'

export function VaultRoutes(): ReactElement {
  const { backgroundState } = useContext(BackgroundContext)

  return <Vault />
}
