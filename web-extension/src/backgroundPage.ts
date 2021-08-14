import { browser, Tabs } from 'webextension-polyfill-ts'
import { executeScriptInCurrentTab } from './util/executeScriptInCurrentTab'
import { authenticator } from 'otplib'
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'

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
let safeClosed = false // Is safe Closed ?
let lockTime = 1000 * 60 * 60 * 8
let isCounting = false
let fireToken = ''
var otpCode = ''

if (auths === undefined) {
  safeClosed = true
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
generateFireToken()
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

chrome.runtime.onMessage.addListener(function (
  request: { GiveMeAuths: Boolean },
  sender,
  sendResponse
) {
  if (request.GiveMeAuths) {
    console.log('sending', auths)
    sendResponse({ auths: auths })
  }
})

chrome.runtime.onMessage.addListener(function (
  req: { generateToken: Boolean },
  sender,
  sendResponse
) {
  if (req.generateToken) {
    console.log('fireToken in Bg script:', fireToken)
    sendResponse({ t: fireToken })
  }
})

chrome.runtime.onMessage.addListener(function (
  request: { close: Boolean; wasClosed: Boolean },
  sender,
  sendResponse
) {
  if (request.close) {
    safeClosed = true
  } else if (request.wasClosed) {
    console.log('isClosed', safeClosed, 'lockTime', lockTime)

    sendResponse({ wasClosed: safeClosed })
  }
})

chrome.runtime.onMessage.addListener((req: { lockTime: number }) => {
  if (req.lockTime) {
    lockTime = req.lockTime
  }
})

//Instead of timeouts set alarm API
chrome.runtime.onMessage.addListener(async (request: { auths: any }) => {
  if (request.auths) {
    safeClosed = false
    auths = request.auths //JSON.parse(request.auths)
    console.log('saving', request.auths, 'in', auths)
  }
})

chrome.runtime.onMessage.addListener(
  (req: { startCount: Boolean }, sender, sendResponse) => {
    if (lockTime !== 1000 * 60 * 60 * 8 && isCounting) {
      isCounting = false
    }
    if (req.startCount && !isCounting) {
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
  }
)

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

// https://stackoverflow.com/questions/34957319/how-to-listen-for-url-change-with-chrome-extension
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, _tab) {
  console.log('~ changeInfo', changeInfo)
  if (changeInfo.url) {
    chrome.tabs.sendMessage(tabId, {
      message: sharedBrowserEvents.URL_CHANGED,
      url: changeInfo.url
    })
  }

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
