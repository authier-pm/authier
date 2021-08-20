import { sharedBrowserEvents } from '@src/background/backgroundPage'
import { MessageType } from '@src/background/chromeRuntimeListener'
import { Passwords } from '@src/providers/PasswProvider'
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
  const [bgPasswords, setBgPasswords] = useState<Passwords[] | undefined>(
    undefined
  )

  useEffect(() => {
    //Get auth from bg
    chrome.runtime.sendMessage(
      { action: MessageType.giveMeAuths },
      function (res: { auths: Array<IAuth> }) {
        if (res && res.auths) {
          setBgAuths(res.auths)
        }
      }
    )

    //Get passwords from bg
    chrome.runtime.sendMessage(
      { action: MessageType.giveMePasswords },
      function (res: { passwords: Array<Passwords> }) {
        if (res && res.passwords) {
          setBgPasswords(res.passwords)
        }
      }
    )

    chrome.runtime.sendMessage(
      { action: MessageType.wasClosed },
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
        action: MessageType.lockTime,
        lockTime: lockTime
      })
      setSafeLockTime(lockTime)
    },
    safeLockTime,
    savePasswodsToBg: (value: Passwords[] | undefined) => {
      chrome.runtime.sendMessage({
        passwords: value
      })

      //@ts-expect-error
      if (value?.length > 0) {
        setBgPasswords(value)
      } else {
        setBgPasswords([])
      }
    },
    saveAuthsToBg: (value: IAuth[] | undefined) => {
      chrome.runtime.sendMessage({
        action: MessageType.auths,
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
        { action: MessageType.startCount },
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
