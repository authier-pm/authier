import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState
} from 'react'

import { browser } from 'webextension-polyfill-ts'

import {
  Box,
  ChakraProvider,
  CircularProgress,
  Flex,
  Grid,
  Heading,
  useInterval
} from '@chakra-ui/react'

import { Trans } from '@lingui/macro'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'

import { sharedBrowserEvents } from '@src/backgroundPage'
import { AddAuthSecretButton } from './AddAuthSecretButton'
import { AuthsList } from './AuthsList'
import { authenticator } from 'otplib'

i18n.activate('en')

export const AuthsContext = createContext<{
  auths: Array<any>
  setAuths: Dispatch<
    SetStateAction<{ secret: string; label: string; icon: string }[]>
  >
}>({ auths: [] } as any)

export const Popup: FunctionComponent = () => {
  useEffect(() => {
    browser.runtime.sendMessage({ popupMounted: true })

    browser.runtime.onMessage.addListener(function (request: {
      message: sharedBrowserEvents
      url: any
    }) {
      // listen for messages sent from background.js
      if (request.message === sharedBrowserEvents.URL_CHANGED) {
        console.log('new url', request.url) // new url is now in content scripts!
      }
    })
  }, [])
  const [seconds, setRemainingSeconds] = useState(authenticator.timeRemaining())

  useInterval(() => {
    setRemainingSeconds(authenticator.timeRemaining())
  }, 1000)

  const [auths, setAuths] = useState([
    {
      secret: 'JBSWY3DPEHPK3PXP',
      label: 'bitfinex',
      icon: 'https://chakra-ui.com/favicon.png'
    }
  ])

  return (
    <ChakraProvider>
      <AuthsContext.Provider value={{ auths, setAuths }}>
        <I18nProvider i18n={i18n}>
          <Flex position="sticky" align="center" p={4}>
            <CircularProgress
              min={1}
              max={30}
              value={30 - seconds}
              valueText={seconds.toString()}
              size="40px"
            />
            <AddAuthSecretButton />
            <Heading size="sm">
              <Trans>Logout</Trans>
            </Heading>
          </Flex>
          <Box height={200} width={300} p={5} mb={5}>
            <Grid gap={3} mb={5}>
              <AuthsList />
            </Grid>
          </Box>
        </I18nProvider>
      </AuthsContext.Provider>
    </ChakraProvider>
  )
}
