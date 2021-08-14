import React, {
  FunctionComponent,
  useContext,
  useEffect,
  useState
} from 'react'

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
import { Menu } from '@src/pages/Menu'
import Login from '@src/pages/Login'
import Register from '@src/pages/Register'
import QRcode from '@src/pages/QRcode'
import {
  IsLoggedInQuery,
  useIsLoggedInQuery,
  useSaveFirebaseTokenMutation,
  useSendAuthMessageLazyQuery
} from './Popup.codegen'
import { getAccessToken, getUserFromToken } from '@src/util/accessToken'
import Devices from '@src/pages/Devices'
import { useSaveAuthsMutation } from './Popup.codegen'
import { SafeUnlockVerification } from '@src/pages/Verification'
import { UserContext } from '@src/providers/UserProvider'
import { AuthsContext, IAuth } from '@src/providers/AuthsProvider'
import { deviceDetect } from 'react-device-detect'
import { getMessaging, getToken } from 'firebase/messaging'
import { Settings } from '@src/pages/Settings'
import { useBackground } from '@src/util/useBackground'
//import { TransitionGroup, CSSTransition } from 'react-transition-group'

const messaging = getMessaging()

i18n.activate('en')

export const Popup: FunctionComponent = () => {
  const {
    isApiLoggedIn: isAuth,
    userId,
    localStorage,
    fireToken,
    setIsVaultLocked
  } = useContext(UserContext)
  const { setAuths, auths } = useContext(AuthsContext)
  const [
    saveFirebaseTokenMutation,
    { data: tokenData, loading: tokenLoading, error: tokenError }
  ] = useSaveFirebaseTokenMutation({})
  const [location, setLocation] = useLocation()
  const [sendAuthMessage, { data, error, loading }] =
    useSendAuthMessageLazyQuery()
  const { currURL, bgAuths, isFilling, safeLocked } = useBackground()

  useEffect(() => {
    if (isAuth && fireToken.length > 1) {
      console.log('client fireToken:', fireToken)
      saveFirebaseTokenMutation({
        variables: {
          userId: userId as string,
          firebaseToken: fireToken as string
        }
      })
    }
  }, [isAuth, fireToken])

  useEffect(() => {
    console.log(bgAuths)
    if (bgAuths && !auths) {
      console.log('got', bgAuths)
      setAuths(bgAuths)
    }
  }, [bgAuths])

  useEffect(() => {
    if (safeLocked) {
      console.log('isLocked', safeLocked)
      setIsVaultLocked(true)
    }
  }, [safeLocked])

  useEffect(() => {
    if (isFilling) {
      console.log('Filling')
      let device = deviceDetect()
      let date = new Date()

      //TODO: get all variables
      sendAuthMessage({
        variables: {
          //@ts-expect-error
          userId: userId,
          device: device.browserName + ' on ' + device.osName,
          location: 'Test',
          pageName: currURL,
          time: date.getHours().toString() + ':' + date.getMinutes().toString()
        }
      })

      //After accept on mobile, send responce and set CanFill to True
      // Listen to the response
    }
  }, [isFilling])

  useEffect(() => {
    browser.runtime.sendMessage({ popupMounted: true })

    browser.runtime.onMessage.addListener(function (request: {
      message: sharedBrowserEvents
      url: any
    }) {
      // listen for messages sent from background.js
      if (request.message === sharedBrowserEvents.URL_CHANGED) {
        //setCurrURL(request.url)
        console.log('new url', request.url) // new url is now in content scripts!
      }
    })
  }, [])

  return (
    <>
      <NavBar />

      <Switch location={location}>
        <Route path="/" component={Home} />
        <Route path="/popup.html" component={Home} />
        <Route path="/menu" component={Menu} />
        <Route path="/QRcode" component={QRcode} />
        <Route path="/devices" component={Devices} />
        <Route path="/settings" component={Settings} />
        <Route path="/verify" component={SafeUnlockVerification} />
      </Switch>
    </>
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

// geolocation
// let geo = navigator.geolocation.getCurrentPosition(
//   (pos) => {
//     console.log(pos)
//   },
//   (er) => {
//     if (er) console.log(er)
//   },
//   { enableHighAccuracy: true }
// )
