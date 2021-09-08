import React, { FunctionComponent, useContext, useEffect } from 'react'

import { Route, Switch, useLocation } from 'wouter'
import browser from 'webextension-polyfill'

import { NavBar } from '@src/components/NavBar'
import { Home } from '../pages/Home'

import { i18n } from '@lingui/core'

import { SharedBrowserEvents } from '@src/background/SharedBrowserEvents'
import cryptoJS from 'crypto-js'
import { Menu } from '@src/pages/Menu'
import { QRCode } from '@src/pages/QRcode'
import {
  useSaveFirebaseTokenMutation,
  useSavePasswordsMutation,
  useSendAuthMessageLazyQuery,
  useSettingsLazyQuery
} from './Popup.codegen'

import Devices from '@src/pages/Devices'
import { SafeUnlockVerification } from '@src/pages/Verification'
import { UserContext } from '@src/providers/UserProvider'
import { AuthsContext } from '@src/providers/AuthsProvider'
import { deviceDetect } from 'react-device-detect'
import { Settings } from '@src/pages/Settings'
import { useBackground } from '@src/util/useBackground'
import { timeToString } from '@src/background/chromeRuntimeListener'
//import { TransitionGroup, CSSTransition } from 'react-transition-group'

i18n.activate('en')

export const Popup: FunctionComponent = () => {
  const {
    isApiLoggedIn: isAuth,
    userId,
    fireToken,
    setIsVaultLocked,
    password
  } = useContext(UserContext)
  const { setAuths } = useContext(AuthsContext)
  const [
    saveFirebaseTokenMutation,
    { data: tokenData, loading: tokenLoading, error: tokenError }
  ] = useSaveFirebaseTokenMutation({})
  const [location, setLocation] = useLocation()
  const [sendAuthMessage, { data, error, loading }] =
    useSendAuthMessageLazyQuery()
  const [savePasswordsMutation] = useSavePasswordsMutation()
  const [
    getSettings,
    { data: settingsData, loading: settingsLoading, error: settingsError }
  ] = useSettingsLazyQuery()
  const {
    currURL,
    bgAuths,
    isFilling,
    safeLocked,
    bgPasswords,
    setSecuritySettings,
    setUISettings
  } = useBackground()

  useEffect(() => {
    async function saveToLocal(encrypted: any) {
      await browser.storage.local.set({
        encryptedPswMasterPassword: encrypted
      })
    }

    //@ts-expect-error
    if (isAuth && bgPasswords?.length > 0) {
      const encrypted = cryptoJS.AES.encrypt(
        JSON.stringify(bgPasswords),
        password
      ).toString()

      savePasswordsMutation({
        variables: {
          payload: encrypted,
          userId: userId as string
        }
      })

      saveToLocal(encrypted)
    }
  }, [isAuth, bgPasswords])

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
    if (bgAuths) {
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

      //After accept on mobile, send response and set CanFill to True
      // Listen to the response
    }
  }, [isFilling])

  useEffect(() => {
    if (isAuth) {
      getSettings({ variables: { userId: userId as string } })

      if (!!settingsData) {
        setSecuritySettings({
          noHandsLogin: settingsData.user.settings.noHandsLogin,
          vaultTime: timeToString(settingsData.user.settings.lockTime) as string
        })
        //@ts-expect-error
        setUISettings({ homeList: settingsData.user.settings.homeUI })
      }
    }
  }, [isAuth])

  useEffect(() => {
    setLocation('/')
    browser.runtime.sendMessage({ popupMounted: true })

    browser.runtime.onMessage.addListener(function (request: {
      message: SharedBrowserEvents
      url: any
    }) {
      // listen for messages sent from background.js
      if (request.message === SharedBrowserEvents.URL_CHANGED) {
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
        <Route path="/qr-code" component={QRCode} />
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
