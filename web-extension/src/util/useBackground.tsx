import { MessageType, sharedBrowserEvents } from '@src/backgroundPage'
import { useState, useEffect } from 'react'
import { browser } from 'webextension-polyfill-ts'

export interface IAuth {
  secret: string
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
}

export function useBackground() {
  const [currURL, setCurrURL] = useState<string>('')
  const [safeLockTime, setSafeLockTime] = useState<number | null>(null)
  const [safeLocked, setSafeLocked] = useState<Boolean>(false)
  const [bgAuths, setBgAuths] = useState<IAuth[] | undefined>(undefined)
  const [isFilling, setIsFilling] = useState<Boolean>(false)
  const [isCounting, setIsCounting] = useState<Boolean>(false)

  useEffect(() => {
    //Get auth from bg
    chrome.runtime.sendMessage(
      MessageType.giveMeAuths,
      function (res: { auths: Array<IAuth> }) {
        if (res && res.auths) {
          setBgAuths(res.auths)
        }
      }
    )

    chrome.runtime.sendMessage(
      { wasClosed: true },
      (res: { wasClosed: Boolean }) => {
        if (res.wasClosed) {
          setSafeLocked(true)
        }
      }
    )

    //change URL
    browser.runtime.onMessage.addListener(function (request: {
      message: sharedBrowserEvents
      url: any
    }) {
      console.log(request)
      // listen for messages sent from background.js
      if (request.message === sharedBrowserEvents.URL_CHANGED) {
        setCurrURL(request.url)
      }
    })

    // Checking if is safe closed
    browser.runtime.onMessage.addListener((request: { safe: string }) => {
      if (request.safe === 'closed') {
        setSafeLocked(true)
      }
    })

    chrome.runtime.onMessage.addListener(
      async (req: { filling: Boolean }, sender, sendResponse) => {
        if (req.filling) {
          setIsFilling(true)
        }
      }
    )
  }, [])

  const backgroundState = {
    currURL,
    safeLocked,
    setSafeLocked,
    isFilling,
    setSafeLockTime: async (lockTime: number | null) => {
      chrome.runtime.sendMessage({
        lockTime: lockTime
      })
      setSafeLockTime(lockTime)
    },
    safeLockTime,
    saveAuthsToBg: (value: IAuth[] | undefined) => {
      chrome.runtime.sendMessage({
        auths: value
      })
      //@ts-expect-error
      if (value?.length > 0) {
        setBgAuths(value)
      } else {
        setBgAuths([])
      }
    },
    bgAuths,
    startCount: () => {
      chrome.runtime.sendMessage(
        { startCount: true },
        (res: { isCounting: Boolean }) => {
          if (res.isCounting) {
            setIsCounting(true)
          }
        }
      )
    },
    isCounting
  }
  // @ts-expect-error
  window.backgroundState = backgroundState
  return backgroundState
}
