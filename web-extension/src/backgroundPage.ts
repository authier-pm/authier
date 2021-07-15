import { browser, Tabs } from 'webextension-polyfill-ts'
import cryptoJS from 'crypto-js'
import { executeScriptInCurrentTab } from './util/executeScriptInCurrentTab'
import { authenticator } from 'otplib'

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

let auths: Array<IAuth> | null
let stopped = false // To stop timeout function, when user has to re enter passwrod
let safeClosed = false // Is safe Closed ?

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
  request: { close: Boolean; wasClosed: Boolean },
  sender,
  sendResponse
) {
  if (request.close) {
    safeClosed = true
  } else if (request.wasClosed) {
    console.log('asked')
    sendResponse({ wasClosed: safeClosed })
  }
})

chrome.runtime.onMessage.addListener(
  async (request: { auths: any; lockTime: number }) => {
    if (request.auths) {
      console.log('saving', auths, request.auths)
      safeClosed = false
      auths = request.auths //JSON.parse(request.auths)

      let close = setTimeout(() => {
        safeClosed = true
        stopped = true
        auths = null
        chrome.runtime.sendMessage({ safe: 'closed' })
      }, request.lockTime)

      if (stopped) {
        clearTimeout(close)
      }
    }
  }
)

chrome.runtime.onMessage.addListener((request: { clear: Boolean }) => {
  if (request.clear) {
    auths = null
  }
})

chrome.runtime.onMessage.addListener((request: { startTimeout: Boolean }) => {
  if (request.startTimeout) {
    stopped = false
  }
})

function fillInput() {
  const inputs = document.getElementsByTagName('input')
  let filtered: Array<HTMLInputElement> = []
  let fun = setInterval(() => {
    filtered = Array.from(inputs).filter((i) => {
      console.log('scanning')
      if (i.id.includes('otp') || i.className.includes('otp')) {
        //Send message to content scrit for query, where it will send notification to users main device
        //Device will send back the authorization

        return true
      }
      return false
    })

    if (filtered[0]) {
      clearInterval(fun)
      //@ts-expect-error
      filtered[0].defaultValue = otp
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
        const otpCode = authenticator.generate(i.secret)
        let a = await executeScriptInCurrentTab(
          `let otp = "${otpCode}";` + `(` + fillInput.toString() + `)()`
        )
      }
    })
  } else if (auths === null) {
    return 'locked'
  }
})
