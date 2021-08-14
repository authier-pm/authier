import { Flex, Spinner } from '@chakra-ui/react'
import React, { ReactElement, useContext, useEffect } from 'react'
import { useLocation } from 'react-router'
import { browser } from 'webextension-polyfill-ts'
import AuthPages from './AuthPages'
import Verification from './pages/Verification'
import { Popup } from './popup/Popup'
import { useIsLoggedInQuery } from './popup/Popup.codegen'
import { AuthsContext } from './providers/AuthsProvider'
import { UserContext } from './providers/UserProvider'
import { useBackground } from './util/backgroundState'

export default function Routes(): ReactElement {
  const { data, loading, error } = useIsLoggedInQuery()
  const { isAuth, verify } = useContext(UserContext)
  const { startCount, safeLocked, isCounting } = useBackground()

  if (isAuth && !safeLocked && !isCounting) {
    console.log('started counting')
    startCount()
  }

  if (loading) {
    return (
      <Flex height={200} width={300} p={5} mb={5} justifyContent="center">
        <Spinner size="xl" />
      </Flex>
    )
  }

  if (verify) {
    return <Verification />
  }

  return <>{isAuth && !verify ? <Popup /> : <AuthPages />}</>
}
