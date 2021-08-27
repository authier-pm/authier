import { sharedBrowserEvents } from '@src/background/backgroundPage'
import { MessageType } from '@src/background/chromeRuntimeListener'
import { UISettings } from '@src/components/setting-screens/UI'
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
export interface SecuritySettings {
  vaultTime: string
  noHandsLogin: boolean
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
  const [securityConfig, setSecurityConfig] = useState<SecuritySettings>({
    noHandsLogin: false,
    vaultTime: '12 hours'
  })
  const [UIConfig, setUIConfig] = useState<UISettings>({ homeList: 'All' })

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

    chrome.runtime.sendMessage(
      { action: MessageType.giveSecuritySettings },
      (res: { config: SecuritySettings }) => {
        if (res && res.config) {
          console.log('tesecuritySett:', res.config)
          setSecurityConfig(res.config)
        }
      }
    )

    chrome.runtime.sendMessage(
      { action: MessageType.giveUISettings },
      (res: { config: UISettings }) => {
        if (res.config) {
          console.log('UiSEttings', res.config)
          setUIConfig(res.config)
        }
      }
    )

    //CHange to switch
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
        action: MessageType.lockTime,
        lockTime: lockTime
      })
      setSafeLockTime(lockTime)
    },
    safeLockTime,
    savePasswordsToBg: (value: Passwords[] | undefined) => {
      chrome.runtime.sendMessage({
        action: MessageType.passwords,
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
        action: MessageType.auths,
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
        { action: MessageType.startCount },
        (res: { isCounting: Boolean }) => {
          if (res.isCounting) {
            setIsCounting(true)
          }
        }
      )
    },
    isCounting,
    bgPasswords,
    setSecuritySettings: (config: SecuritySettings) => {
      setSecurityConfig(config)
      //Call bg script to save settings to bg, maybe Save it here to BD
      chrome.runtime.sendMessage({
        action: MessageType.securitySettings,
        settings: config
      })
    },
    securityConfig,
    setUISettings: (config: UISettings) => {
      setUIConfig(config)
      console.log('sending', config)
      chrome.runtime.sendMessage({
        action: MessageType.UISettings,
        config: config
      })
    },
    UIConfig
  }
  // @ts-expect-error
  window.backgroundState = backgroundState
  return backgroundState
}
