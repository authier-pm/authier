import { SharedBrowserEvents } from '@src/background/SharedBrowserEvents'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { useState, useEffect, useContext } from 'react'
import browser from 'webextension-polyfill'
import { useUpdateSettingsMutation } from '@src/pages/Settings.codegen'

import {
  UIOptions,
  UISettings
} from '@src/components/setting-screens/SettingsForm'
import { vaultLockTimeOptions } from '@src/components/setting-screens/SecuritySettings'
import { useSettingsQuery } from '@src/popup/Popup.codegen'
import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import {
  EncryptedSecrets,
  EncryptedSecretsType
} from '../../../shared/generated/graphqlBaseTypes'
import cryptoJS from 'crypto-js'
import { toast } from 'react-toastify'

export interface ITOTPSecret {
  secret: string
  label: string
  icon: string | undefined
  lastUsed?: Date | null
  originalUrl: string | undefined
}

export interface ILoginCredentials {
  label: string
  favIconUrl: string | undefined
  lastUsed?: Date | null
  originalUrl: string
  password: string
  username: string
}
export interface ISecuritySettings {
  vaultLockTime: number
  noHandsLogin: boolean
}

export interface ISecuritySettingsInBg {
  vaultTime: number
  noHandsLogin: boolean
}

let registered = false // we need to only register once

export function useBackgroundState() {
  //TODO use single useState hook for all of these
  const [currentURL, setCurrentURL] = useState<string>('')
  const { data: settingsData, refetch: refetchSettings } = useSettingsQuery()

  const [safeLocked, setSafeLocked] = useState<Boolean>(false)

  const [isFilling, setIsFilling] = useState<Boolean>(false)
  const [isCounting, setIsCounting] = useState<Boolean>(false)
  const [backgroundState, setBackgroundState] =
    useState<IBackgroundStateSerializable | null>(null)

  const [UIConfig, setUIConfig] = useState<UISettings>({
    homeList: UIOptions.all
  })
  const [updateSettings] = useUpdateSettingsMutation()
  console.log('~ backgroundState', backgroundState)

  //TODO move this whole thing into it' own hook
  useEffect(() => {
    if (registered) {
      return
    }
    registered = true
    console.log('useEffect registering!!')

    //Get auth from bg
    browser.runtime
      .sendMessage({ action: BackgroundMessageType.getBackgroundState })
      .then((res: { backgroundState: IBackgroundStateSerializable }) => {
        console.log('~ res backgroundState', res)
        if (res && res.backgroundState) {
          setBackgroundState(res.backgroundState)
          console.log('~ res.backgroundState', res.backgroundState)
        }
      })

    browser.runtime
      .sendMessage({ action: BackgroundMessageType.wasClosed })
      .then((res: { wasClosed: Boolean }) => {
        if (res.wasClosed) {
          setSafeLocked(true)
        }
      })

    browser.runtime
      .sendMessage({ action: BackgroundMessageType.giveSecuritySettings })
      .then((res: { config: ISecuritySettingsInBg }) => {
        if (res && res.config) {
          backgroundStateContext.setSecuritySettings({
            noHandsLogin: res.config.noHandsLogin,
            vaultLockTime: res.config.vaultTime
          })
        }
      })

    browser.runtime.onMessage.addListener(function (request: {
      message: SharedBrowserEvents
      url: any
    }) {
      console.log('onMessage', request)
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
        }
      }
    )
  }, [])

  const backgroundStateContext = {
    currentURL,
    safeLocked,
    setSafeLocked,
    isFilling,
    backgroundState,
    loginUser: async (
      masterPassword: string,
      userId: string,
      secrets: Array<Pick<EncryptedSecrets, 'encrypted' | 'kind'>>
    ) => {
      setSafeLocked(false)
      debugger
      const decryptAndParse = (
        data: string,
        password = masterPassword
      ): ILoginCredentials[] | ITOTPSecret[] => {
        try {
          return JSON.parse(
            cryptoJS.AES.decrypt(data, password as string, {
              iv: cryptoJS.enc.Utf8.parse(userId as string)
            }).toString()
          )
        } catch (err) {
          console.error(err)
          toast.error('decryption failed')
          return []
        }
      }
      let totpSecretsEncrypted
      let credentialsSecretsEncrypted

      if (secrets.length > 0) {
        totpSecretsEncrypted = secrets.filter(
          ({ kind }) => kind === EncryptedSecretsType.TOTP
        )[0]?.encrypted

        credentialsSecretsEncrypted = secrets.filter(
          ({ kind }) => kind === EncryptedSecretsType.LOGIN_CREDENTIALS
        )[0]?.encrypted
      }
      const payload: IBackgroundStateSerializable = {
        masterPassword,
        userId,
        loginCredentials: credentialsSecretsEncrypted
          ? (decryptAndParse(
              credentialsSecretsEncrypted,
              masterPassword
            ) as ILoginCredentials[])
          : [],
        totpSecrets: totpSecretsEncrypted
          ? (decryptAndParse(
              totpSecretsEncrypted,
              masterPassword
            ) as ITOTPSecret[])
          : []
      }
      browser.runtime.sendMessage({
        action: BackgroundMessageType.setBackgroundState,
        payload
      })

      setBackgroundState(payload)
    },
    savePasswordsToBg: (passwords: ILoginCredentials[]) => {
      if (backgroundState) {
        const newBgState = {
          ...backgroundState,
          loginCredentials: passwords
        }
        browser.runtime.sendMessage({
          action: BackgroundMessageType.setBackgroundState,
          payload: newBgState
        })
        setBackgroundState(newBgState)
      }
    },
    saveAuthsToBg: (totpSecrets: ITOTPSecret[]) => {
      if (backgroundState) {
        const newBgState = {
          ...backgroundState,
          totpSecrets: totpSecrets
        }
        browser.runtime.sendMessage({
          action: BackgroundMessageType.setBackgroundState,
          payload: newBgState
        })
        setBackgroundState(newBgState)
      }
    },

    isCounting,
    setSecuritySettings: (config: ISecuritySettings) => {
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
      browser.runtime.sendMessage({
        action: BackgroundMessageType.securitySettings,
        settings: config
      })
    },

    setUISettings: (config: UISettings) => {
      setUIConfig(config)

      browser.runtime.sendMessage({
        action: BackgroundMessageType.UISettings,
        config: config
      })
    },
    logoutUser: () => {
      setBackgroundState(null)
      browser.runtime.sendMessage({
        action: BackgroundMessageType.clear
      })
    },
    UIConfig
  }

  // @ts-expect-error
  window.backgroundState = backgroundStateContext
  return backgroundStateContext
}
