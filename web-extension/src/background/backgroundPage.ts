import browser from 'webextension-polyfill'
import { executeScriptInCurrentTab } from '../util/executeScriptInCurrentTab'
import { authenticator } from 'otplib'
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'
import { twoFAs } from './chromeRuntimeListener'
import { ILoginCredentials } from '@src/util/useBackgroundState'
import { noHandsLogin } from './chromeRuntimeListener'
import { SharedBrowserEvents } from './SharedBrowserEvents'

const firebaseConfig = {
  apiKey: 'AIzaSyBkBIcE71acyLg1yMNJwn3Ys_CxbY5gt7U',
  authDomain: 'authier-bc184.firebaseapp.com',
  projectId: 'authier-bc184',
  storageBucket: 'authier-bc184.appspot.com',
  messagingSenderId: '500382892914',
  appId: '1:500382892914:web:6b202f90d6c0c6bcc213eb',
  measurementId: 'G-0W2MW55WVF'
}

interface IAuth {
  secret: string
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
}
const firebaseApp = initializeApp(firebaseConfig)
const messaging = getMessaging(firebaseApp)

const broadcast = new BroadcastChannel('test-channel')

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then(function (registration) {
      console.log(
        'ServiceWorker registration successful with scope: ',
        registration.scope
      )
    })
    .catch(function (err) {
      //registration failed :(
      console.log('ServiceWorker registration failed: ', err)
    })
} else {
  console.log('No service-worker on this browser')
}

//Null for logout, undefined for Chrome refresh
export let passwords: Array<ILoginCredentials> = []
export let lockTime = 10000 * 60 * 60 * 8
export let fireToken = ''
let otpCode = ''

export function setPasswords(val: any) {
  passwords = val
}

export function setLockTime(val: number) {
  console.log('setLockTime', val)
  if (typeof val !== 'number') {
    throw new Error('setLockTime must have a number value')
  }
  lockTime = val
}

broadcast.onmessage = (event) => {
  if (event.data.data.success === 'true') {
    console.log('sec', typeof otpCode)
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
  console.log('fireToken', fireToken)
})
// Listen for messages sent from other parts of the extension
browser.runtime.onMessage.addListener(
  async (request: { popupMounted: boolean }) => {
    // Log statement if request.popupMounted is true
    // NOTE: this request is sent in `popup/component.tsx`
    if (request.popupMounted) {
      console.log('backgroundPage notified that Popup.tsx has mounted.')
    }
  }
)

function fillInput(credentials: string) {
  const inputs = document.getElementsByTagName('input')
  let filtered: Array<HTMLInputElement> = []
  let scan = setInterval(() => {
    filtered = Array.from(inputs).filter((i) => {
      console.log('scanning')
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
      console.log('OTP test', credentials)
      //Send message to content script for query, where it will send notification to users main device
      //Device will send back the authorization
      //chrome.runtime.sendMessage({ filling: true })
      //@ts-expect-error
      if (credentials.token) {
        //@ts-expect-error
        filtered[0].defaultValue = credentials.token
      }

      // const mobileAuth = setInterval(() => {
      //   console.log('PLEASE', canFill)
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

export type SessionStoredItem = {
  username: any
  password: any
  originalUrl: string
  label: string
  willSave: boolean
}

function getStoredCredentials() {
  const AUTHIER_SESSION_STORAGE_KEY = '__authier'
  let __authier = sessionStorage.getItem(AUTHIER_SESSION_STORAGE_KEY)
  sessionStorage.removeItem(AUTHIER_SESSION_STORAGE_KEY)
  return __authier
}

const currentPageInfo: chrome.tabs.TabChangeInfo & {
  originalUrl: string
} & any = {}

// https://stackoverflow.com/questions/34957319/how-to-listen-for-url-change-with-chrome-extension
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, _tab) {
  // if (changeInfo.url) {
  if (_tab.status === 'complete') {
    chrome.tabs.sendMessage(tabId, {
      message: SharedBrowserEvents.URL_CHANGED,
      url: _tab.url
    })

    //Get username and password on register
    const password = passwords?.find((item) => {
      if (
        _tab.url
          ?.toLocaleLowerCase()
          .search(item.label?.toLocaleLowerCase()) !== -1
      ) {
        return true
      }
      return false
    })

    // await executeScriptInCurrentTab(
    //   `(` +
    //     initInputWatch.toString() +
    //     `)(${JSON.stringify({
    //       ...password,
    //       noHandsLogin: noHandsLogin,
    //       hasData: !!password
    //     })})`
    // )

    if (!password) {
      let scanForItem = setInterval(async () => {
        let payload = await executeScriptInCurrentTab(
          `(` + getStoredCredentials.toString() + `)()`
        )

        if (payload) {
          clearInterval(scanForItem)
          const item: SessionStoredItem = JSON.parse(payload)
          if (item.willSave) {
            const alreadyExists = passwords?.find((credentialItem) => {
              return item.originalUrl === credentialItem.originalUrl
            })
            console.log('exists', alreadyExists)
            console.log('~ item', item)
            if (!alreadyExists) {
              passwords?.push({
                password: item.password,
                username: item.username,
                originalUrl: item.originalUrl,
                label: item.label,
                ...currentPageInfo
              })

              chrome.runtime.sendMessage({ passwords: passwords })
            }
          }
        }
      }, 1000)
    }
  }

  if (twoFAs) {
    twoFAs.map(async (i) => {
      if (
        _tab.url?.toLocaleLowerCase().search(i.label.toLocaleLowerCase()) !== -1
      ) {
        otpCode = authenticator.generate(i.secret)
        console.log('first', otpCode)
        let a = await executeScriptInCurrentTab(
          `(` +
            fillInput.toString() +
            `)(${JSON.stringify({ token: otpCode })})`
        )
      }
    })
  }
})
