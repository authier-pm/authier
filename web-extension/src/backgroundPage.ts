import { browser, Tabs } from 'webextension-polyfill-ts'
import { executeScriptInCurrentTab } from './util/executeScriptInCurrentTab'
import { authenticator } from 'otplib'
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'
import { Passwords } from './providers/PasswProvider'

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

let auths: Array<IAuth> | null | undefined = undefined
let passwords: Array<Passwords> | null | undefined = []
let safeClosed = false // Is safe Closed ?
let lockTime = 10000 * 60 * 60 * 8
let isCounting = false
let fireToken = ''
let otpCode = ''

// if (auths === undefined) {
//   safeClosed = true
// }

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

export enum MessageType {
  giveMeAuths = 'GiveMeAuths',
  getFirebaseToken = 'getFirebaseToken',
  wasClosed = 'wasClosed',
  giveMePasswords = 'giveMePasswords',
  startCount = 'startCount',
  lockTime = 'lockTime',
  auths = 'auths'
}

chrome.runtime.onMessage.addListener(function (
  req:
    | { action: MessageType }
    | { action: 'lockTime' | 'auths'; lockTime: number; auths: any },
  sender,
  sendResponse
) {
  switch (req.action) {
    case MessageType.giveMeAuths:
      console.log('sending', auths)
      sendResponse({ auths: auths })
      break

    case MessageType.getFirebaseToken:
      console.log('fireToken in Bg script:', fireToken)
      sendResponse({ t: fireToken })
      break

    case MessageType.wasClosed:
      console.log('isClosed', safeClosed, 'lockTime', lockTime)
      sendResponse({ wasClosed: safeClosed })
      break

    case MessageType.giveMePasswords:
      console.log('test', req)
      break

    case MessageType.startCount:
      if (lockTime !== 1000 * 60 * 60 * 8 && isCounting) {
        isCounting = false
      }
      if (!isCounting) {
        isCounting = true
        setTimeout(() => {
          isCounting = false
          safeClosed = true
          auths = null
          chrome.runtime.sendMessage({ safe: 'closed' })
          console.log('locked', safeClosed)
        }, lockTime)
        sendResponse({ isCounting: true })
      }
      break

    case MessageType.lockTime:
      //@ts-expect-error
      lockTime = req.lockTime
      break

    case MessageType.auths:
      safeClosed = false // ????? What is this why ?
      //@ts-expect-error
      auths = req.auths

    default:
      if (typeof req === 'string') {
        throw new Error(`${req} not supported`)
      }
  }
})

// chrome.runtime.onMessage.addListener((req: { lockTime: number }) => {
//   if (req.lockTime) {
//     lockTime = req.lockTime
//   }
// })

//Instead of timeouts set alarm API
// chrome.runtime.onMessage.addListener(async (request: { auths: any }) => {
//   if (request.auths) {
//     safeClosed = false
//     auths = request.auths //JSON.parse(request.auths)
//     console.log('saving', request.auths, 'in', auths)
//   }
// })

function fillInput() {
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

      //Send message to content scrit for query, where it will send notification to users main device
      //Device will send back the authorization
      chrome.runtime.sendMessage({ filling: true })
      // if (OTP !== undefined) {
      //   //@ts-expect-error
      //   filtered[0].defaultValue = OTP
      // } else {

      // }

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

function initWatch() {
  let username = document.querySelector("input[name='username']")
  let password = document.querySelector("input[name='password']")
  let submitButton = document.querySelector('#form')

  submitButton?.addEventListener('submit', (e) => {
    sessionStorage.setItem(
      '__authier',
      JSON.stringify({
        //@ts-expect-error
        username: username.value,
        //@ts-expect-error
        password: password.value
      })
    )
  })
}

function getStoredCredentials() {
  let values = sessionStorage.getItem('__authier')
  sessionStorage.removeItem('__authier')
  return values
}

// https://stackoverflow.com/questions/34957319/how-to-listen-for-url-change-with-chrome-extension
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, _tab) {
  console.log('~ changeInfo', changeInfo)
  if (changeInfo.url) {
    chrome.tabs.sendMessage(tabId, {
      message: sharedBrowserEvents.URL_CHANGED,
      url: changeInfo.url
    })
  }

  //Get username and password on register
  await executeScriptInCurrentTab(`(` + initWatch.toString() + `)()`)

  const pswd = passwords?.find((item) => {
    return item.originalUrl === changeInfo.url
  })
  console.log(pswd)
  if (!pswd) {
    const pageInfo = {
      originalUrl: changeInfo.url,
      icon: changeInfo.favIconUrl,
      label: changeInfo.title as string
    }
    console.log('info', pageInfo)
    let scanForItem = setInterval(async () => {
      let payload = await executeScriptInCurrentTab(
        `(` + getStoredCredentials.toString() + `)()`
      )
      if (payload) {
        console.log('lol', payload)
        clearInterval(scanForItem)
        let item = JSON.parse(payload)
        passwords?.push({
          password: item.password,
          username: item.username,
          ...pageInfo
        })
        console.log(passwords)
      }
    }, 1000)
  }

  // if (passwords) {
  //   passwords.map(async (i) => {
  //     if (_tab.url === i.originalUrl) {
  //       console.log('first', otpCode)
  //       let a = await executeScriptInCurrentTab(
  //         `const name = ${i.username};` +
  //           `const psw = ${i.password};` +
  //           `(` +
  //           fillInput.toString() +
  //           `)()`
  //       )
  //     }
  //   })
  // }

  if (auths) {
    console.log('hasAuths', auths)
    auths.map(async (i) => {
      if (_tab.url === i.originalUrl) {
        otpCode = authenticator.generate(i.secret)
        console.log('first', otpCode)
        let a = await executeScriptInCurrentTab(
          `(` + fillInput.toString() + `)()`
        )
      }
    })
  } else if (auths === null) {
    return 'locked'
  }
})
