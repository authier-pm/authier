import { SharedBrowserEvents } from '@src/background/SharedBrowserEvents'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { Settings } from '@src/pages/Settings'
import { useState, useEffect, useContext } from 'react'
import { browser } from 'webextension-polyfill-ts'

export interface IAuth {
  secret: string
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
}

export interface Passwords {
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
  password: string
  username: string
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
  const [settingConfig, setSettingsConfig] = useState<Settings>({
    NoHandsLogin: false,
    TwoFA: false,
    vaultTime: '12 hours'
  })

  useEffect(() => {
    //Get auth from bg
    chrome.runtime.sendMessage(
      { action: BackgroundMessageType.giveMeAuths },
      function (res: { auths: Array<IAuth> }) {
        if (res && res.auths) {
          setBgAuths(res.auths)
        }
      }
    )

    //Get passwords from bg
    chrome.runtime.sendMessage(
      { action: BackgroundMessageType.giveMePasswords },
      function (res: { passwords: Array<Passwords> }) {
        if (res && res.passwords) {
          setBgPasswords(res.passwords)
        }
      }
    )

    chrome.runtime.sendMessage(
      { action: BackgroundMessageType.wasClosed },
      (res: { wasClosed: Boolean }) => {
        if (res.wasClosed) {
          setSafeLocked(true)
        }
      }
    )

    //CHange to switch
    browser.runtime.onMessage.addListener(function (request: {
      message: SharedBrowserEvents
      url: any
    }) {
      console.log(request)
      // listen for messages sent from background.js
      if (request.message === SharedBrowserEvents.URL_CHANGED) {
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

    browser.runtime.onMessage.addListener(
      (req: { passwords: Array<Passwords> }) => {
        if (req.passwords) {
          setBgPasswords(req.passwords)
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
        action: BackgroundMessageType.lockTime,
        lockTime: lockTime
      })
      setSafeLockTime(lockTime)
    },
    safeLockTime,
    savePasswordsToBg: (value: Passwords[] | undefined) => {
      chrome.runtime.sendMessage({
        action: BackgroundMessageType.passwords,
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
      console.log('saving 02', value)
      chrome.runtime.sendMessage({
        action: BackgroundMessageType.auths,
        auths: value
      })
      //@ts-expect-error
      if (value?.length > 0) {
        setBgAuths(value)
        console.log('in', bgAuths)
      } else {
        setBgAuths([])
      }
    },
    bgAuths,
    startCount: () => {
      chrome.runtime.sendMessage(
        { action: BackgroundMessageType.startCount },
        (res: { isCounting: Boolean }) => {
          if (res.isCounting) {
            setIsCounting(true)
          }
        }
      )
    },
    isCounting,
    bgPasswords,
    setSettingsConfig: (config: Settings) => {
      //Call bg script to save settings to bg, maybe Save it here to BD
    }
  }
  // @ts-expect-error
  window.backgroundState = backgroundState
  return backgroundState
}
