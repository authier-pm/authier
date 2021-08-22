import { Flex, Spinner } from '@chakra-ui/react'
import React, { ReactElement, useContext, useEffect } from 'react'
import { useLocation } from 'react-router'
import { browser } from 'webextension-polyfill-ts'
import AuthPages from './AuthPages'
import { SafeUnlockVerification } from './pages/Verification'
import { Popup } from './popup/Popup'
import { useIsLoggedInQuery } from './popup/Popup.codegen'
import { AuthsContext } from './providers/AuthsProvider'
import { UserContext } from './providers/UserProvider'
import { useBackground } from './util/useBackground'

export default function Routes(): ReactElement {
  const { data, loading, error } = useIsLoggedInQuery()
  const { isApiLoggedIn, isVaultLocked, setIsVaultLocked } =
    useContext(UserContext)
  const { startCount, isCounting, safeLocked, bgAuths } = useBackground()

  //Change this is not ideal
  useEffect(() => {
    if (bgAuths === undefined && isApiLoggedIn) {
      setIsVaultLocked(true)
    } else {
      setIsVaultLocked(false)
    }
  }, [bgAuths])

  if (isVaultLocked) {
    return <SafeUnlockVerification />
  }

  if (isApiLoggedIn && !safeLocked && !isCounting) {
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

  return <>{data?.authenticated ? <Popup /> : <AuthPages />}</>
}
