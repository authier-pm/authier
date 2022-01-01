import { Flex, Spinner } from '@chakra-ui/react'
import React, { ReactElement, useContext, useEffect } from 'react'

import browser from 'webextension-polyfill'
import AuthPages from './AuthPages'
import { VaultUnlockVerification } from './pages/VaultUnlockVerification'
import { Popup } from './popup/Popup'

import { BackgroundContext } from './providers/BackgroundProvider'

export default function Routes(): ReactElement {
  const { backgroundState } = useContext(BackgroundContext)
  console.log('~ backgroundState', backgroundState)

  if (!backgroundState) {
    return <AuthPages />
  }
  if (!backgroundState.masterPassword && backgroundState.userId) {
    return <VaultUnlockVerification />
  }

  return <Popup />
}
