import { UISettings } from '@src/components/setting-screens/UI'
import { SharedBrowserEvents } from '@src/background/SharedBrowserEvents'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { Settings } from '@src/pages/Settings'
import { useState, useEffect, useContext } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { useUpdateSettingsMutation } from '@src/pages/Settings.codegen'
import { timeObject } from '@src/background/chromeRuntimeListener'
import { UserContext } from '@src/providers/UserProvider'

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
  originalUrl: string
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
  const [updateSettings, { data, loading, error }] = useUpdateSettingsMutation()
  const { userId } = useContext(UserContext)
  //TODO save settings to DB in set setSecuritySettings

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

    chrome.runtime.sendMessage(
      { action: BackgroundMessageType.giveSecuritySettings },
      (res: { config: SecuritySettings }) => {
        if (res && res.config) {
          console.log('tesecuritySett:', res.config)
          setSecurityConfig(res.config)
        }
      }
    )

    chrome.runtime.sendMessage(
      { action: BackgroundMessageType.giveUISettings },
      (res: { config: UISettings }) => {
        if (res.config) {
          console.log('UiSEttings', res.config)
          setUIConfig(res.config)
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
      //Maybe save to DB here because when you remove item you must close the popup
      chrome.runtime.sendMessage({
        action: BackgroundMessageType.auths,
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
    setSecuritySettings: (config: SecuritySettings) => {
      updateSettings({
        variables: {
          lockTime: timeObject[config.vaultTime],
          noHandsLogin: config.noHandsLogin,
          homeUI: UIConfig.homeList,
          twoFA: true, //Not added in the settings yet
          userId: userId as string
        }
      })

      setSecurityConfig(config)
      //Call bg script to save settings to bg
      chrome.runtime.sendMessage({
        action: BackgroundMessageType.securitySettings,
        settings: config
      })
    },
    securityConfig,
    setUISettings: (config: UISettings) => {
      updateSettings({
        variables: {
          lockTime: timeObject[securityConfig.vaultTime],
          noHandsLogin: securityConfig.noHandsLogin,
          homeUI: config.homeList,
          twoFA: true, //Not added in the settings yet
          userId: userId as string
        }
      })

      setUIConfig(config)

      chrome.runtime.sendMessage({
        action: BackgroundMessageType.UISettings,
        config: config
      })
    },
    UIConfig
  }
  // @ts-expect-error
  window.backgroundState = backgroundState
  return backgroundState
}
