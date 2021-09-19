import { Flex, Spinner } from '@chakra-ui/react'
import React, { ReactElement, useContext } from 'react'
import AuthPages from './AuthPages'
import Vault from './pages-vault/Vault'
import { VaultUnlockVerification } from './pages/VaultUnlockVerification'
import { Popup } from './popup/Popup'
import { useIsLoggedInQuery } from './popup/Popup.codegen'
import { BackgroundContext } from './providers/BackgroundProvider'

export default function Routes(): ReactElement {
  const { masterPassword } = useContext(BackgroundContext)

  if (!masterPassword) {
    return <VaultUnlockVerification />
  }

  return <Vault />
}
