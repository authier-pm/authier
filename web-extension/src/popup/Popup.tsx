import React, { FunctionComponent, useContext, useEffect } from 'react'

import { Route, Switch, useLocation } from 'wouter'
import { browser } from 'webextension-polyfill-ts'

import { NavBar } from '@src/components/NavBar'
import { Home } from '../pages/Home'

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
import { IsLoggedInQuery, useIsLoggedInQuery } from './Popup.codegen'
import { getAccessToken } from '@src/util/accessToken'
import Devices from '@src/pages/Devices'
import { useSaveAuthsMutation } from './Popup.codegen'
import Verification from '@src/pages/Verification'
import { UserContext } from '@src/providers/UserProvider'
import { AuthsContext, IAuth } from '@src/providers/AuthsProvider'

i18n.activate('en')

export const Popup: FunctionComponent = () => {
  const { password, isAuth, userId, verify, setVerify, setPassword } =
    useContext(UserContext)
  const { auths, setAuths } = useContext(AuthsContext)

  const [location, setLocation] = useLocation()

  useEffect(() => {
    // chrome.runtime.sendMessage(
    //   { wasClosed: true },
    //   function (res: { wasClosed: Boolean }) {
    //     if (res.wasClosed) {
    //       console.log('wasClose res:', res)
    //       setVerify(true)
    //     }
    //   }
    // )

    if (isAuth?.authenticated && !verify) {
      console.log('home')
      setLocation('/')
    } else if (!isAuth?.authenticated) {
      console.log('login')
      setLocation('/login')
    } else if (isAuth.authenticated && verify) {
      console.log('verify')
      setLocation('/verify')
    }
  }, [isAuth?.authenticated])

  // 1. Safe device key of web to DB
  // 2. On add device safe key to DB
  // 3. On fill send message from web to (main) device
  // 4. On accept send message from device back to web and fill
  useEffect(() => {
    chrome.runtime.sendMessage(
      { GiveMeAuths: true },
      function (res: { auths: Array<IAuth> }) {
        if (res.auths) {
          setAuths(res.auths)
          console.log('got', res.auths)
        } else if (res.auths === undefined) {
          //Reenter password
          setVerify(true)
        }
      }
    )
  }, [])

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
        setVerify(true)
        setLocation('/verify')
      }
    })

    browser.runtime.onMessage.addListener((request: { filling: Boolean }) => {
      if (request.filling) {
        //call api
      }
    })
  }, [])

  return (
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
        <Route path="/verify" component={Verification} />
      </Switch>
    </I18nProvider>
  )
}

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
