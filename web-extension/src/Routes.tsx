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
  const { data, loading } = useIsLoggedInQuery()

  const { safeLocked } = useContext(BackgroundContext)
  console.log('~ safeLocked', safeLocked)

  if (loading) {
    return (
      <Flex height={200} width={300} p={5} mb={5} justifyContent="center">
        <Spinner size="xl" />
      </Flex>
    )
  }
  if (!data?.authenticated) {
    return <AuthPages />
  }
  if (safeLocked) {
    return <VaultUnlockVerification />
  }

  return <Popup />
}
