import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState
} from 'react'

import { Route, Switch, useLocation } from 'wouter'

import { browser } from 'webextension-polyfill-ts'

import {
  Box,
  ChakraProvider,
  CircularProgress,
  Flex,
  Grid,
  Heading,
  useInterval,
  Text
} from '@chakra-ui/react'

import { NavBar } from '@src/components/NavBar'
import { Home } from '../pages/Home'

import { Trans } from '@lingui/macro'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'

import { sharedBrowserEvents } from '@src/backgroundPage'
import { AddAuthSecretButton } from './AddAuthSecretButton'
import { AuthsList } from './AuthsList'
import { authenticator } from 'otplib'
import { Settings } from '@src/pages/Settings'
import Login from '@src/pages/Login'
import Register from '@src/pages/Register'

i18n.activate('en')

export const AuthsContext = createContext<{
  auths: Array<any>
  setAuths: Dispatch<
    SetStateAction<{ secret: string; label: string; icon: string }[]>
  >
}>({ auths: [] } as any)

export const Popup: FunctionComponent = () => {
  const [location, setLocation] = useLocation()
  useEffect(() => {
    setLocation('/login')
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
          <NavBar />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/settings" component={Settings} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
          </Switch>
        </I18nProvider>
      </AuthsContext.Provider>
    </ChakraProvider>
  )
}
