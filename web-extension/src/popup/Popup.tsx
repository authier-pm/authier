import React, { FunctionComponent, useContext, useEffect } from 'react'

import { Route, Switch, useLocation } from 'wouter'
import browser from 'webextension-polyfill'

import { NavBar } from '@src/components/NavBar'
import { Home } from '../pages/Home'

import { i18n } from '@lingui/core'

import { SharedBrowserEvents } from '@src/background/SharedBrowserEvents'
import cryptoJS from 'crypto-js'

import { QRCode } from '@src/pages/QRcode'
import { useSendAuthMessageLazyQuery } from './Popup.codegen'

import Devices from '@src/pages/Devices'
import { UserContext } from '@src/providers/UserProvider'

import { deviceDetect } from 'react-device-detect'
import { Settings } from '@src/pages/Settings'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { vaultLockTimeOptions } from '@src/components/setting-screens/SecuritySettings'
import { AboutPage } from '@src/pages/AboutPage'
//import { TransitionGroup, CSSTransition } from 'react-transition-group'
import debug from 'debug'
const log = debug('au:Popup')

i18n.activate('en')

export const Popup: FunctionComponent = () => {
  const { userId } = useContext(UserContext)

  const [location, setLocation] = useLocation()
  const [sendAuthMessage, { data, error, loading }] =
    useSendAuthMessageLazyQuery()

  const { currentURL, isFilling } = useContext(DeviceStateContext)

  // useEffect(() => {
  //   async function saveToLocal(encrypted: any) {
  //     await browser.storage.local.set({
  //       encryptedPswMasterPassword: encrypted
  //     })
  //   }

  //   if (userId && bgPasswords.length > 0) {
  //     const encrypted = cryptoJS.AES.encrypt(
  //       JSON.stringify(bgPasswords),
  //       masterPassword,
  //       { iv: CryptoJS.enc.Utf8.parse(userId) }
  //     ).toString()

  //     // TODO move this into background-we cannot rely on popup being opened for saving it
  //     savePasswordsMutation({
  //       variables: {
  //         payload: encrypted
  //       }
  //     })

  //     saveToLocal(encrypted)
  //   }
  // }, [userId, bgPasswords])

  // useEffect(() => {
  //   if (bgAuths) {
  //     console.log('got', bgAuths)
  //     setAuths(bgAuths)
  //   }
  // }, [bgAuths])

  useEffect(() => {
    if (isFilling) {
      log('Filling')
      let device = deviceDetect()
      let date = new Date()

      //TODO: get all variables
      sendAuthMessage({
        variables: {
          //@ts-expect-error
          userId: userId,
          device: device.browserName + ' on ' + device.osName,
          location: 'Test',
          pageName: currentURL,
          time: date.getHours().toString() + ':' + date.getMinutes().toString()
        }
      })

      //After accept on mobile, send response and set CanFill to True
      // Listen to the response
    }
  }, [isFilling])

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
        <Route path="/secrets" component={Home} />
        <Route path="/popup.html" component={Home} />
        <Route path="/qr-code" component={QRCode} />
        <Route path="/devices" component={Devices} />
        <Route path="/settings" component={Settings} />
        <Route path="/about" component={AboutPage} />
      </Switch>
    </>
  )
}
