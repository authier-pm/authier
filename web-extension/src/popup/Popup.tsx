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

import { ChakraProvider, Flex } from '@chakra-ui/react'

import { NavBar } from '@src/components/NavBar'
import { Home } from '../pages/Home'

import { Trans } from '@lingui/macro'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'

import { sharedBrowserEvents } from '@src/backgroundPage'
import { AddAuthSecretButton } from '../components/AddAuthSecretButton'
import { AuthsList } from '../components/AuthsList'
import { authenticator } from 'otplib'
import cryptoJS from 'crypto-js'
import { Settings } from '@src/pages/Settings'
import Login from '@src/pages/Login'
import Register from '@src/pages/Register'
import QRcode from '@src/pages/QRcode'
import {
  IsLoggedInQuery,
  useIsLoggedInLazyQuery,
  useIsLoggedInQuery
} from './Popup.codegen'
import { getAccessToken } from '@src/util/accessToken'
import Devices from '@src/pages/Devices'
import { useSaveAuthsMutation } from './Popup.codegen'

i18n.activate('en')

export const AuthsContext = createContext<{
  auths: Array<IAuth>
  setAuths: Dispatch<SetStateAction<IAuth[]>>
}>({ auths: [] } as any)

export const UserContext = createContext<{
  password: string
  setPassword: Dispatch<SetStateAction<string>>
  setUserId: Dispatch<SetStateAction<string>>
}>({} as any)

export interface IAuth {
  secret: string
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
}

export const Popup: FunctionComponent = () => {
  const [password, setPassword] = useState<string>('bob')
  const [userId, setUserId] = useState<string>('')
  const [isAuth, setIsAuth] = useState<IsLoggedInQuery>()
  const [saveAuthsMutation] = useSaveAuthsMutation()
  const { data, loading, error } = useIsLoggedInQuery({
    onCompleted: (e) => {
      setIsAuth(e)
    }
  })
  const [location, setLocation] = useLocation()

  const masterPassword = 'some_fake'

  const [auths, setAuths] = useState<IAuth[]>([])

  // {
  //     secret: 'JBSWY3DPEHPK3PXP',
  //     label: 'bitfinex',
  //     icon: 'https://chakra-ui.com/favicon.png',
  //     lastUsed: new Date(),
  //     originalUrl: 'https://www.bitfinex.com/login'
  //   }

  useEffect(() => {
    if (isAuth) {
      setLocation('/')
    } else {
      setLocation('/login')
    }
  }, [isAuth])

  useEffect(() => {
    browser.runtime.sendMessage({ popupMounted: true })

    browser.runtime.onMessage.addListener(function (request: {
      message: sharedBrowserEvents
      url: any
    }) {
      console.log(request)
      // listen for messages sent from background.js
      if (request.message === sharedBrowserEvents.URL_CHANGED) {
        console.log('new url', request.url) // new url is now in content scripts!
      }
    })

    browser.runtime.onMessage.addListener((request: { safe: string }) => {
      if (request.safe === 'closed') {
        console.log('closed', request.safe)
        setPassword('')
      }
    })
  }, [])

  useEffect(() => {
    console.log(auths, password)
    chrome.runtime.sendMessage(
      { GiveMeAuths: true },
      function (res: { auths: Array<IAuth> }) {
        setAuths(res.auths)
      }
    )
    // ;(async () => {
    //   const storage = await browser.storage.local.get()
    //   console.log('stroage', storage)
    //   if (storage.encryptedAuthsMasterPassword && password) {
    //     const decryptedAuths = cryptoJS.AES.decrypt(
    //       storage.encryptedAuthsMasterPassword,
    //       password
    //     ).toString(cryptoJS.enc.Utf8)
    //     console.log('decrypting auths!!!', decryptedAuths)
    //     await browser.runtime.sendMessage({
    //       setAuths: decryptedAuths,
    //       lockTime: 5000
    //     })
    //     console.log('~ decryptedAuth23s', JSON.parse(decryptedAuths))

    //     setAuths(JSON.parse(decryptedAuths))
    //   }
    // })()
  }, [])

  return (
    <ChakraProvider>
      <UserContext.Provider value={{ password, setPassword, setUserId }}>
        <AuthsContext.Provider
          value={{
            auths,
            setAuths: async (value) => {
              console.log('saving', password, value, isAuth?.authenticated)
              await chrome.runtime.sendMessage({
                auths: value,
                lockTime: 28800000
              })

              const encrypted = cryptoJS.AES.encrypt(
                JSON.stringify(value),
                password
              ).toString()

              await saveAuthsMutation({
                variables: {
                  payload: encrypted,
                  userId: isAuth?.authenticated as string
                }
              })

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
              <Route path="/devices" component={Devices} />
            </Switch>
          </I18nProvider>
        </AuthsContext.Provider>
      </UserContext.Provider>
    </ChakraProvider>
  )
}
