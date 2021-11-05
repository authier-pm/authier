import { Flex, Spinner } from '@chakra-ui/react'
import React, { ReactElement, useContext, useEffect } from 'react'
import { useLocation } from 'react-router'
import browser from 'webextension-polyfill'
import AuthPages from './AuthPages'
import { VaultUnlockVerification } from './pages/VaultUnlockVerification'
import { Popup } from './popup/Popup'
import { useIsLoggedInQuery } from './popup/Popup.codegen'
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
