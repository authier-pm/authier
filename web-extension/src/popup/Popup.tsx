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
import { Settings } from '@src/pages/Settings'
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
import Verification from '@src/pages/Verification'
import { UserContext } from '@src/providers/UserProvider'
import { AuthsContext, IAuth } from '@src/providers/AuthsProvider'
import { deviceDetect } from 'react-device-detect'
import { getMessaging, getToken } from 'firebase/messaging'

const messaging = getMessaging()

i18n.activate('en')

export const Popup: FunctionComponent = () => {
  const [currURL, setCurrURL] = useState('')
  const { isAuth, verify, setVerify, userId, setUserId } =
    useContext(UserContext)
  const { auths, setAuths } = useContext(AuthsContext)
  const [
    saveFirebaseTokenMutation,
    { data: tokenData, loading: tokenLoading, error: tokenError }
  ] = useSaveFirebaseTokenMutation({})
  const [location, setLocation] = useLocation()
  const [sendAuthMessage, { data, error, loading }] =
    useSendAuthMessageLazyQuery()
  const [fireToken, setFireToken] = useState<string>('')

  useEffect(() => {
    if (isAuth) {
      console.log('client fireToken:', fireToken)
      saveFirebaseTokenMutation({
        variables: {
          userId: userId as string,
          firebaseToken: fireToken as string
        }
      })
    }
    // Conditions for 'page' flow
    if (isAuth && !verify) {
      console.log('home')
      setLocation('/')
    } else if (!isAuth) {
      console.log('login')
      setLocation('/login')
    } else if (isAuth && verify) {
      console.log('verify')
      setLocation('/verify')
    }
  }, [isAuth])

  // Effect for getting auths from bg script
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

    //Get firetoken from bg script
    chrome.runtime.sendMessage(
      { generateToken: true },
      (res: { t: string }) => {
        setFireToken(res.t)
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
        setCurrURL(request.url)
        console.log('new url', request.url) // new url is now in content scripts!
      }
    })

    // Checking if is safe closed
    browser.runtime.onMessage.addListener((request: { safe: string }) => {
      if (request.safe === 'closed') {
        console.log('closed', request.safe)
        setVerify(true)
        setLocation('/verify')
      }
    })

    chrome.runtime.onMessage.addListener(
      async (req: { filling: Boolean }, sender, sendResponse) => {
        if (req.filling) {
          console.log('Filling')
          let id = await getUserFromToken()
          let device = deviceDetect()
          let date = new Date()

          //TODO: get all variables
          sendAuthMessage({
            variables: {
              //@ts-expect-error
              userId: id.userId,
              device: device.browserName + ' on ' + device.osName,
              location: 'Test',
              pageName: currURL,
              time:
                date.getHours().toString() + ':' + date.getMinutes().toString()
            }
          })

          //After accept on mobile, send responce and set CanFill to True
          // Listen to the response
        }
      }
    )
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
