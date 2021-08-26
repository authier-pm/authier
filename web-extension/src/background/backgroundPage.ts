import { browser, Tabs } from 'webextension-polyfill-ts'
import { executeScriptInCurrentTab } from '../util/executeScriptInCurrentTab'
import { authenticator } from 'otplib'
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'
import { twoFAs } from './chromeRuntimeListener'
import { Passwords } from '@src/util/useBackground'
import { noHandsLogin } from './chromeRuntimeListener'

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

export enum sharedBrowserEvents {
  URL_CHANGED = 'URL_CHANGED'
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

export let passwords: Array<Passwords> = []
export let lockTime = 10000 * 60 * 60 * 8
export let fireToken = ''
let otpCode = ''

export function setPasswords(val: any) {
  passwords = val
}

export function setLockTime(val: number) {
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
      //Send message to content scrit for query, where it will send notification to users main device
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

type SessionStoredItem = {
  username: any
  password: any
  originalUrl: string
  label: string
}

function initInputWatch(credentials?: string) {
  let loginFields: any = []
  let inputs = document.getElementsByTagName('input')
  for (let j = 0; j < inputs.length; j++) {
    if (inputs[j].type === 'password') {
      loginFields = [inputs[j - 1], inputs[j]]
    }
  }

  let submit = document.querySelector('#submit') // get the button with some diff way

  let username = loginFields[0]
  let password = loginFields[1]

  console.log({ credentials, location })
  console.log(username, password)

  if (username && password) {
    document.body.addEventListener('click', (e) => {
      if (username.value && password.value) {
        const sessionStoredItem: SessionStoredItem = {
          username: username.value,
          password: password.value,
          originalUrl: location.href,
          label: location.hostname
        }
        console.log('test', sessionStoredItem)
        sessionStorage.setItem('__authier', JSON.stringify(sessionStoredItem))
      }
    })
  }

  //@ts-expect-error
  if (credentials.username) {
    // TODO fill password & username
    //@ts-expect-error
    username.value = credentials.username
    //@ts-expect-error
    password.value = credentials.password

    //@ts-expect-error
    if (credentials.noHandsLogin && submit) {
      //@ts-expect-error
      submit.click()
    }
  }
}

function getStoredCredentials() {
  let __authier = sessionStorage.getItem('__authier')
  sessionStorage.removeItem('__authier')
  return __authier
}

const currentPageInfo: chrome.tabs.TabChangeInfo & {
  originalUrl: string
} & any = {}
// https://stackoverflow.com/questions/34957319/how-to-listen-for-url-change-with-chrome-extension
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, _tab) {
  if (changeInfo.url) {
    chrome.tabs.sendMessage(tabId, {
      message: sharedBrowserEvents.URL_CHANGED,
      url: changeInfo.url
    })

    //Get username and password on register

    const pswd = passwords?.find((item) => {
      return item.originalUrl === changeInfo.url
    })
    await executeScriptInCurrentTab(
      `(` +
        initInputWatch.toString() +
        `)(${JSON.stringify({ ...pswd, noHandsLogin: noHandsLogin })})`
    )

    console.log(pswd)
    if (!pswd) {
      let scanForItem = setInterval(async () => {
        let payload = await executeScriptInCurrentTab(
          `(` + getStoredCredentials.toString() + `)()`
        )

        if (payload) {
          clearInterval(scanForItem)
          const item: SessionStoredItem = JSON.parse(payload)
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

          console.log(passwords)
        }
      }, 1000)
    }
  } else {
    Object.assign(currentPageInfo, changeInfo)
  }

  if (twoFAs) {
    console.log('hasAuths', twoFAs)
    twoFAs.map(async (i) => {
      if (_tab.url === i.originalUrl) {
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
