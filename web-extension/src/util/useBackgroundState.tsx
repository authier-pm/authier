import { SharedBrowserEvents } from '@src/background/SharedBrowserEvents'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { useState, useEffect, useContext, useReducer } from 'react'
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
  EncryptedSecretGql,
  EncryptedSecretType
} from '../../../shared/generated/graphqlBaseTypes'
import cryptoJS from 'crypto-js'
import { toast } from 'react-toastify'
import { omit } from 'lodash'
import debug from 'debug'
const log = debug('au:useBackgroundState')

export interface ISecret {
  encrypted: string
  kind: EncryptedSecretType
  label: string
  iconUrl: string | undefined | null
  url: string
  lastUsed?: Date | null
}
export interface ITOTPSecret extends ISecret {
  totp: string
  kind: EncryptedSecretType.TOTP
}

export interface ILoginSecret extends ISecret {
  loginCredentials: {
    password: string
    username: string
  }
  kind: EncryptedSecretType.LOGIN_CREDENTIALS
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

const { AES, enc } = cryptoJS

export function useBackgroundState() {
  //TODO use single useState hook for all of these
  const [currentURL, setCurrentURL] = useState<string>('')
  const [refreshCount, forceUpdate] = useReducer((x) => x + 1, 0)
  const [safeLocked, setSafeLocked] = useState<Boolean>(false)

  const [isFilling, setIsFilling] = useState<Boolean>(false)
  const [isCounting, setIsCounting] = useState<Boolean>(false)
  const [backgroundState, setBackgroundState] =
    useState<IBackgroundStateSerializable | null>(null)

  const [UIConfig, setUIConfig] = useState<UISettings>({
    homeList: UIOptions.all
  })
  const [updateSettings] = useUpdateSettingsMutation()
  log('~ backgroundState2', backgroundState)

  //TODO move this whole thing into it' own hook
  useEffect(() => {
    if (registered) {
      return
    }
    registered = true
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
        passwords: Array<ILoginSecret>
      }) => {
        if (request.filling) {
          setIsFilling(true)
        } else if (request.safe === 'closed') {
          setSafeLocked(true)
        }
      }
    )
  }, [])

  // handle background state refresh
  useEffect(() => {
    browser.runtime
      .sendMessage({ action: BackgroundMessageType.getBackgroundState })
      .then((res: { backgroundState: IBackgroundStateSerializable }) => {
        if (res && res.backgroundState) {
          setBackgroundState(res.backgroundState)
        }
      })
  }, [refreshCount])

  const getCryptoOptions = () => {
    if (!backgroundState) {
      throw new Error('No background state')
    }

    return {
      iv: enc.Utf8.parse(backgroundState.userId)
    }
  }

  const backgroundStateContext = {
    currentURL,
    safeLocked,
    setSafeLocked,
    isFilling,
    forceUpdate,
    backgroundState,
    deviceLogin: async (state: IBackgroundStateSerializable) => {
      log('deviceLogin', state)
      setSafeLocked(false)
      setBackgroundState(state)

      await browser.runtime.sendMessage({
        action: BackgroundMessageType.setBackgroundState,
        payload: state
      })
    },
    get LoginCredentials() {
      if (!backgroundState) {
        return []
      }
      const { secrets } = backgroundState
      const filtered = secrets.filter(
        ({ kind }) => kind === EncryptedSecretType.LOGIN_CREDENTIALS
      )
      return filtered.map((secret) => {
        try {
          const decrypted = cryptoJS.AES.decrypt(
            secret.encrypted,
            backgroundState.masterPassword,
            {
              iv: cryptoJS.enc.Utf8.parse(backgroundState.userId)
            }
          ).toString(cryptoJS.enc.Utf8)

          const parsed = JSON.parse(decrypted)
          return {
            ...secret,
            loginCredentials: parsed
          }
        } catch (err) {
          console.error(err)
          toast.error('decryption failed')
          throw err
        }
      })
    },
    get TOTPSecrets() {
      if (!backgroundState) {
        return []
      }
      const { secrets } = backgroundState
      const filtered = secrets.filter(
        ({ kind }) => kind === EncryptedSecretType.TOTP
      )
      return filtered.map((secret) => {
        try {
          const decrypted = cryptoJS.AES.decrypt(
            secret.encrypted,
            backgroundState.masterPassword,
            {
              iv: cryptoJS.enc.Utf8.parse(backgroundState.userId)
            }
          ).toString(cryptoJS.enc.Utf8)

          return {
            ...secret,
            totp: decrypted
          }
        } catch (err) {
          console.error(err)
          toast.error('decryption failed')
          throw err
        }
      })
    },
    saveLoginCredentials: (passwords: ILoginSecret[]) => {
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
    saveTOTPSecrets: (totpSecrets: ITOTPSecret[]) => {
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

    lockVault: async () => {
      browser.runtime.sendMessage({
        action: BackgroundMessageType.clear
      })
      setBackgroundState(null)
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

      // refetchSettings()
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
    UIConfig,
    encrypt(data: string, password = backgroundState?.masterPassword): string {
      return AES.encrypt(
        data,
        password as string,
        getCryptoOptions()
      ).toString()
    },
    decrypt(data: string, password = backgroundState?.masterPassword): string {
      return AES.decrypt(data, password as string, getCryptoOptions()).toString(
        enc.Utf8
      )
    }
  }

  // @ts-expect-error
  window.backgroundState = backgroundStateContext
  return backgroundStateContext
}
