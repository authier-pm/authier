import { browser, Tabs } from 'webextension-polyfill-ts'
import cryptoJS from 'crypto-js'
import { executeScriptInCurrentTab } from './executeScriptInCurrentTab'
import { authenticator } from 'otplib'

interface IAuth {
  secret: string
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
}

let auths: Array<IAuth>

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

browser.runtime.onMessage.addListener(async (request: { setAuths: string }) => {
  // Log statement if request.popupMounted is true
  // NOTE: this request is sent in `popup/component.tsx`
  console.log(request)
  if (request.setAuths) {
    auths = JSON.parse(request.setAuths)
  }
  console.log('authes added', auths)
})

export enum sharedBrowserEvents {
  URL_CHANGED = 'URL_CHANGED'
}

function fillInput() {
  const inputs = document.getElementsByTagName('input')
  let filtered: Array<HTMLInputElement> = []
  let fun = setInterval(() => {
    filtered = Array.from(inputs).filter((i) => {
      console.log('scanning')
      if (i.id.includes('otp') || i.className.includes('otp')) {
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

    // TODO if the url is in user's list of auth secrets we should execute the autofill here
  }

  if (auths) {
    console.log('hasAuths', auths)
    auths.map(async (i) => {
      console.log(i.originalUrl)
      if (_tab.url === i.originalUrl) {
        console.log(i.secret)
        const otpCode = authenticator.generate(i.secret)
        let a = await executeScriptInCurrentTab(
          `let otp = "${otpCode}";` + `(` + fillInput.toString() + `)()`
        )
        console.log(a)
      }
    })
  }
})
