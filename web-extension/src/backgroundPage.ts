import { browser, Tabs } from 'webextension-polyfill-ts'
import cryptoJS from 'crypto-js'
import { executeScriptInCurrentTab } from './executeScriptInCurrentTab'

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
  if (request.setAuths) {
    auths = JSON.parse(request.setAuths)
  }
  console.log('authes added')
})

export enum sharedBrowserEvents {
  URL_CHANGED = 'URL_CHANGED'
}

function fillInput() {
  const inputs = document.getElementsByTagName('input')
  let filtered = []
  let fun = setInterval(() => {
    filtered = Array.from(inputs).filter((i) => {
      if (i.id.includes('otp') || i.className.includes('otp')) {
        return true
      }
      return false
    })

    if (filtered[0]) {
      console.log(filtered[0])
      clearInterval(fun)
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
    auths.map(async (i) => {
      console.log(i.originalUrl)
      if (_tab.url === i.originalUrl) {
        let a = await executeScriptInCurrentTab(
          `(` + fillInput.toString() + `)()`
        )
        console.log(a)
      }
    })
  }
})
