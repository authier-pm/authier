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

import { ChakraProvider } from '@chakra-ui/react'

import { NavBar } from '@src/components/NavBar'
import { Home } from '../pages/Home'

import { Trans } from '@lingui/macro'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'

import { sharedBrowserEvents } from '@src/backgroundPage'
import { AddAuthSecretButton } from './AddAuthSecretButton'
import { AuthsList } from '../components/AuthsList'
import { authenticator } from 'otplib'
import cryptoJS from 'crypto-js'

import { Settings } from '@src/pages/Settings'
import Login from '@src/pages/Login'
import Register from '@src/pages/Register'
import QRcode from '@src/pages/QRcode'
import { useIsLoggedInQuery } from './Popup.codegen'
import { getAccessToken } from '@src/util/accessToken'

i18n.activate('en')

export const AuthsContext = createContext<{
  auths: Array<IAuth>
  setAuths: Dispatch<SetStateAction<IAuth[]>>
}>({ auths: [] } as any)

export interface IAuth {
  secret: string
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
}

export const Popup: FunctionComponent = () => {
  const { data, loading, error } = useIsLoggedInQuery({
    fetchPolicy: 'network-only'
  })
  const [location, setLocation] = useLocation()

  const masterPassword = 'some_fake'

  const [auths, setAuths] = useState<IAuth[]>([
    {
      secret: 'JBSWY3DPEHPK3PXP',
      label: 'bitfinex',
      icon: 'https://chakra-ui.com/favicon.png',
      lastUsed: new Date(),
      originalUrl: 'http://www.google.com'
    }
  ])

  //ADD LOADING SCREEN

  useEffect(() => {
    // User auth
    if (data) {
      setLocation('/')
    } else {
      setLocation('/login')
    }

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
    ;(async () => {
      const storage = await browser.storage.local.get()
      console.log(storage)
      if (storage.encryptedAuthsMasterPassword) {
        const decryptedAuths = cryptoJS.AES.decrypt(
          storage.encryptedAuthsMasterPassword,
          masterPassword
        ).toString(cryptoJS.enc.Utf8)
        console.log('~ decryptedAuth23s', JSON.parse(decryptedAuths))

        setAuths(JSON.parse(decryptedAuths))
      }
    })()
  }, [data])

  return (
    <ChakraProvider>
      <AuthsContext.Provider
        value={{
          auths,
          setAuths: async (value) => {
            const encrypted = cryptoJS.AES.encrypt(
              JSON.stringify(value),
              masterPassword
            ).toString()

            await browser.storage.local.set({
              encryptedAuthsMasterPassword: encrypted
            })
            setAuths(value)
          }
        }}
      >
        <I18nProvider i18n={i18n}>
          <NavBar />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/popup.html" component={Home} />
            <Route path="/settings" component={Settings} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/QRcode" component={QRcode} />
          </Switch>
        </I18nProvider>
      </AuthsContext.Provider>
    </ChakraProvider>
  )
}
