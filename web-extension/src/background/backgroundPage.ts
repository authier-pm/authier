import browser from 'webextension-polyfill'
import { executeScriptInCurrentTab } from '../util/executeScriptInCurrentTab'
import { authenticator } from 'otplib'
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'

import {
  ILoginSecret,
  ISecret,
  ITOTPSecret
} from '@src/util/useBackgroundState'
import './chromeRuntimeListener'
import { SharedBrowserEvents } from './SharedBrowserEvents'

import debug from 'debug'
import { apolloClient } from '@src/apollo/apolloClient'
//import { SavePasswordsDocument } from '@src/popup/Popup.codegen'

import cryptoJS from 'crypto-js'
import {
  AddEncryptedSecretDocument,
  AddEncryptedSecretMutation,
  AddEncryptedSecretMutationVariables
} from './backgroundPage.codegen'
import {
  EncryptedSecretGql,
  EncryptedSecretType
} from '../../../shared/generated/graphqlBaseTypes'

export const log = debug('au:backgroundPage')
localStorage.debug = 'au:*' // enable all debug messages

const firebaseConfig = {
  apiKey: 'AIzaSyBkBIcE71acyLg1yMNJwn3Ys_CxbY5gt7U',
  authDomain: 'authier-bc184.firebaseapp.com',
  projectId: 'authier-bc184',
  storageBucket: 'authier-bc184.appspot.com',
  messagingSenderId: '500382892914',
  appId: '1:500382892914:web:6b202f90d6c0c6bcc213eb',
  measurementId: 'G-0W2MW55WVF'
}

const firebaseApp = initializeApp(firebaseConfig)
const messaging = getMessaging(firebaseApp)

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

type SecretSerializedType = Pick<
  EncryptedSecretGql,
  'id' | 'encrypted' | 'kind' | 'label' | 'iconUrl' | 'url'
>

export interface IBackgroundStateSerializable {
  email: string
  userId: string
  masterPassword: string
  secrets: Array<SecretSerializedType>
}

interface IBackgroundState extends IBackgroundStateSerializable {
  encrypt: (stringToEncrypt: string) => string
  addSecret: (
    input: Omit<ITOTPSecret, 'id'> | Omit<ILoginSecret, 'id'>
  ) => Promise<SecretSerializedType>
}

export let bgState: IBackgroundState | null = null

export const setBgState = async (
  bgStateSerializable: IBackgroundStateSerializable
) => {
  bgState = {
    ...bgStateSerializable,
    encrypt(stringToEncrypt: string) {
      return cryptoJS.AES.encrypt(stringToEncrypt, this.masterPassword, {
        iv: cryptoJS.enc.Utf8.parse(this.userId)
      }).toString()
    },

    /**
     * invokes the backend mutation and pushes the new secret to the bgState
     * @param secret
     * @returns the added secret
     */
    async addSecret(secret) {
      const stringToEncrypt =
        secret.kind === EncryptedSecretType.TOTP
          ? secret.totp
          : JSON.stringify(secret.loginCredentials)

      const encrypted = this.encrypt(stringToEncrypt)

      const { data } = await apolloClient.mutate<
        AddEncryptedSecretMutation,
        AddEncryptedSecretMutationVariables
      >({
        mutation: AddEncryptedSecretDocument,
        variables: {
          payload: {
            encrypted,
            kind: secret.kind,
            label: secret.label,
            iconUrl: secret.iconUrl,
            url: secret.url
          }
        }
      })
      if (!data) {
        throw new Error('failed to save secret')
      }
      log('saved secret to the backend', secret)
      const secretAdded = data.me.addEncryptedSecret

      bgState?.secrets.push(secretAdded)
      return secretAdded
    }
  }

  await browser.storage.local.set({
    backgroundState: bgStateSerializable
  })

  // @ts-expect-error
  window.bgState = bgState
}
;(async () => {
  // init bgState from local storage if it has been set
  const storage = await browser.storage.local.get()
  if (storage.backgroundState) {
    setBgState(storage.backgroundState)
    log('bg init from storage', bgState)
  }
})()

export const clearBgState = () => {
  bgState = null
}

export let lockTime = 10000 * 60 * 60 * 8
export let fireToken = ''
let otpCode = ''

export function setLockTime(val: number) {
  log('setLockTime', val)
  if (typeof val !== 'number') {
    throw new Error('setLockTime must have a number value')
  }
  lockTime = val
}

broadcast.onmessage = (event) => {
  if (event.data.data.success === 'true') {
    log('sec', typeof otpCode)
    let a = executeScriptInCurrentTab(
      `const OTP = ${otpCode};` + `(` + fillInput.toString() + `)()`
    )
  }
}

async function generateFireToken() {
  fireToken = await getToken(messaging, {
    vapidKey:
      'BPxh_JmX3cR4Cb6lCYon2cC0iAVlv8dOL1pjX2Q33ROT0VILKuGAlTqG1uH8YZXQRCscLlxqct0XeTiUvF4sy4A'
  })
}
generateFireToken().then(() => {
  log('fireToken', fireToken)
})
// Listen for messages sent from other parts of the extension
browser.runtime.onMessage.addListener(
  async (request: { popupMounted: boolean }) => {
    // Log statement if request.popupMounted is true
    // NOTE: this request is sent in `popup/component.tsx`
    if (request.popupMounted) {
      log('backgroundPage notified that Popup.tsx has mounted.')
    }
  }
)

function fillInput(credentials: string) {
  const inputs = document.getElementsByTagName('input')
  let filtered: Array<HTMLInputElement> = []
  let scan = setInterval(() => {
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
