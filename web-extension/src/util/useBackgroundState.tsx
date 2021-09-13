import { SharedBrowserEvents } from '@src/background/SharedBrowserEvents'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { useState, useEffect, useContext } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { useUpdateSettingsMutation } from '@src/pages/Settings.codegen'
import { timeObject, timeToString } from '@src/background/chromeRuntimeListener'
import { UserContext } from '@src/providers/UserProvider'
import {
  UIOptions,
  UISettings
} from '@src/components/setting-screens/SettingsForm'
import { vaultLockTimeOptions } from '@src/components/setting-screens/Security'
import { useSettingsQuery } from '@src/popup/Popup.codegen'

export interface ITOTPSecret {
  secret: string
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
}

export interface ILoginCredentials {
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string
  password: string
  username: string
}
export interface SecuritySettings {
  vaultLockTime: number
  noHandsLogin: boolean
}

export interface SecuritySettingsInBg {
  vaultTime: number
  noHandsLogin: boolean
}

let registered = false // we need to only register once

export function useBackgroundState() {
  //TODO use single useState hook for all of these
  const [currentURL, setCurrentURL] = useState<string>('')
  const { data: settingsData, refetch: refetchSettings } = useSettingsQuery()

  const [safeLocked, setSafeLocked] = useState<Boolean>(false)
  const [bgAuths, setBgAuths] = useState<ITOTPSecret[]>([])
  const [isFilling, setIsFilling] = useState<Boolean>(false)
  const [isCounting, setIsCounting] = useState<Boolean>(false)
  const [bgPasswords, setBgPasswords] = useState<ILoginCredentials[]>([])

  const [UIConfig, setUIConfig] = useState<UISettings>({
    homeList: UIOptions.all
  })
  const [updateSettings, { data, loading, error }] = useUpdateSettingsMutation()

  //TODO move this whole thing into it' own hook
  useEffect(() => {
    if (registered) {
      return
    }
    registered = true
    console.log('useEffect registering!!')

    //Get auth from bg
    chrome.runtime.sendMessage(
      { action: BackgroundMessageType.giveMeAuths },
      (res: { auths: Array<ITOTPSecret> }) => {
        if (res && res.auths) {
          setBgAuths(res.auths)
        }
      }
    )

    //Get passwords from bg
    chrome.runtime.sendMessage(
      { action: BackgroundMessageType.giveMePasswords },
      (res: { passwords: Array<ILoginCredentials> }) => {
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
      (res: { config: SecuritySettingsInBg }) => {
        if (res && res.config) {
          backgroundState.setSecuritySettings({
            noHandsLogin: res.config.noHandsLogin,
            vaultLockTime: res.config.vaultTime
          })
        }
      }
    )

    chrome.runtime.sendMessage(
      { action: BackgroundMessageType.giveUISettings },
      (res: { config: UISettings }) => {
        if (res.config) {
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
        setCurrentURL(request.url)
      }
    })

    // Checking if is safe closed
    browser.runtime.onMessage.addListener(
      (request: {
        safe: string
        filling: Boolean
        passwords: Array<ILoginCredentials>
      }) => {
        if (request.filling) {
          setIsFilling(true)
        } else if (request.safe === 'closed') {
          setSafeLocked(true)
        } else if (request.passwords) {
          setBgPasswords(request.passwords)
        }
      }
    )
  }, [])

  const backgroundState = {
    currentURL,
    safeLocked,
    setSafeLocked,
    isFilling,
    loginUser: async (totp: ITOTPSecret[], passwords: ILoginCredentials[]) => {
      console.log('safe unclcsd2', passwords, bgPasswords, totp, bgAuths)

      setSafeLocked(false)
      chrome.runtime.sendMessage({
        action: BackgroundMessageType.passwords,
        passwords
      })

      setBgPasswords(passwords)

      chrome.runtime.sendMessage({
        action: BackgroundMessageType.auths,
        auths: totp
      })
      setBgAuths(totp)

      chrome.runtime.sendMessage(
        { action: BackgroundMessageType.startCount },
        (res: { isCounting: Boolean }) => {
          if (res.isCounting) {
            setIsCounting(true)
          }
        }
      )
    },
    savePasswordsToBg: (passwords: ILoginCredentials[]) => {
      chrome.runtime.sendMessage({
        action: BackgroundMessageType.passwords,
        passwords
      })

      setBgPasswords(passwords)
    },
    saveAuthsToBg: (totpSecrets: ITOTPSecret[]) => {
      //Maybe save to DB here because when you remove item you must close the popup
      chrome.runtime.sendMessage({
        action: BackgroundMessageType.auths,
        auths: totpSecrets
      })
      setBgAuths(totpSecrets)
    },
    bgAuths,
    isCounting,
    bgPasswords,
    setSecuritySettings: (config: SecuritySettings) => {
      updateSettings({
        variables: {
          lockTime: config.vaultLockTime,
          noHandsLogin: config.noHandsLogin,
          homeUI: UIConfig.homeList,
          twoFA: true //Not added in the settings yet
        }
      })

      refetchSettings()
      //Call bg script to save settings to bg
      chrome.runtime.sendMessage({
        action: BackgroundMessageType.securitySettings,
        settings: config
      })
    },

    setUISettings: (config: UISettings) => {
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
