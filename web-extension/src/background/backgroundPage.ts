import './chromeRuntimeListener'

import browser from 'webextension-polyfill'
import { executeScriptInCurrentTab } from '../util/executeScriptInCurrentTab'
import { authenticator } from 'otplib'
import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

import { ILoginSecret, ISecret, ITOTPSecret } from '@src/util/useDeviceState'
import { SharedBrowserEvents } from './SharedBrowserEvents'

import debug from 'debug'
import {
  EncryptedSecretGql,
  EncryptedSecretType
} from '../../../shared/generated/graphqlBaseTypes'

export const log = debug('au:backgroundPage')
localStorage.debug = 'au:*' // enable all debug messages

const broadcast = new BroadcastChannel('test-channel')

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then(function (registration) {
      log(
        'ServiceWorker registration successful with scope: ',
        registration.scope
      )
    })
    .catch(function (err) {
      //registration failed :(
      log('ServiceWorker registration failed: ', err)
    })
} else {
  log('No service-worker on this browser')
}

export type SecretSerializedType = Pick<
  EncryptedSecretGql,
  'id' | 'encrypted' | 'kind' | 'label' | 'iconUrl' | 'url'
>

export interface IBackgroundStateSerializableLocked {
  email: string
  userId: string
  secrets: Array<SecretSerializedType>
}

export interface IBackgroundStateSerializable
  extends IBackgroundStateSerializableLocked {
  masterPassword: string
}

export const lockTime = 10000 * 60 * 60 * 8

// Listen for messages sent from other parts of the extension
// browser.runtime.onMessage.addListener(
//   async (request: { popupMounted: boolean }) => {
//     // Log statement if request.popupMounted is true
//     // NOTE: this request is sent in `popup/component.tsx`
//     if (request.popupMounted) {
//       log('backgroundPage notified that Popup.tsx has mounted.')
//     }
//   }
// )

function fillInput(credentials: string) {
  const inputs = document.getElementsByTagName('input')
  let filtered: Array<HTMLInputElement> = []
  const scan = setInterval(() => {
    filtered = Array.from(inputs).filter((i) => {
      log('scanning')
      if (
        i.id.includes('otp') ||
        i.className.includes('otp') ||
        i.className.includes('text-input')
      ) {
        return true
      }
      return false
    })

    if (filtered[0]) {
      clearInterval(scan)
      log('OTP test', credentials)
      //Send message to content script for query, where it will send notification to users main device
      //Device will send back the authorization
      //chrome.runtime.sendMessage({ filling: true })
      //@ts-expect-error
      if (credentials.token) {
        //@ts-expect-error
        filtered[0].defaultValue = credentials.token
      }

      // const mobileAuth = setInterval(() => {
      //   log('PLEASE', canFill)
      //   if (canFill) {
      //     clearInterval(mobileAuth)
      //     //@ts-expect-error
      //     filtered[0].defaultValue = otp
      //   }
      // }, 2000)
    }
  }, 1000)

  return inputs
}
