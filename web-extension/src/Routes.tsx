import { Flex, Spinner } from '@chakra-ui/react'
import React, { ReactElement, useContext, useEffect } from 'react'
import { useLocation } from 'react-router'
import { browser } from 'webextension-polyfill-ts'
import AuthPages from './AuthPages'
import { Popup } from './popup/Popup'
import { useIsLoggedInQuery } from './popup/Popup.codegen'
import { AuthsContext } from './providers/AuthsProvider'
import { UserContext } from './providers/UserProvider'

export default function Routes(): ReactElement {
  const { data, loading, error } = useIsLoggedInQuery()
  const { isAuth, verify } = useContext(UserContext)

  if (loading) {
    return (
      <Flex height={200} width={300} p={5} mb={5} justifyContent="center">
        <Spinner size="xl" />
      </Flex>
    )
  }

  return <>{isAuth && !verify ? <Popup /> : <AuthPages />}</>
}
