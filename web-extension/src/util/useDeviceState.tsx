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
import { removeToken } from './accessTokenExtension'
import { device } from '@src/background/ExtensionDevice'
const log = debug('au:useDeviceState')

export interface ISecret {
  id: string
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

export function useDeviceState() {
  //TODO use single useState hook for all of these
  const [currentURL, setCurrentURL] = useState<string>('')

  const [safeLocked, setSafeLocked] = useState<Boolean>(false)

  const [isFilling, setIsFilling] = useState<Boolean>(false)
  const [isCounting, setIsCounting] = useState<Boolean>(false)
  const [deviceState, setDeviceState] =
    useState<IBackgroundStateSerializable | null>(device.state)

  const [UIConfig, setUIConfig] = useState<UISettings>({
    homeList: UIOptions.all
  })
  const [updateSettings] = useUpdateSettingsMutation()
  log('~ deviceState', deviceState)

  useEffect(() => {
    setDeviceState(device.state)
  }, [device.state])

  const onStorageChange = async (
    changes: Record<string, browser.Storage.StorageChange>,
    areaName: string
  ): Promise<void> => {
    if (areaName === 'local' && changes.backgroundState) {
      setDeviceState(changes.backgroundState.newValue)
    }
  }

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

    browser.storage.onChanged.addListener(onStorageChange)
  }, [])

  const backgroundStateContext = {
    currentURL,
    safeLocked,
    setSafeLocked,
    isFilling,
    deviceState,
    get LoginCredentials() {
      if (!deviceState) {
        return []
      }
      const { secrets } = deviceState
      const filtered = secrets.filter(
        ({ kind }) => kind === EncryptedSecretType.LOGIN_CREDENTIALS
      )
      return filtered.map((secret) => {
        try {
          const decrypted = cryptoJS.AES.decrypt(
            secret.encrypted,
            deviceState.masterPassword,
            {
              iv: cryptoJS.enc.Utf8.parse(deviceState.userId)
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
      if (!deviceState) {
        return []
      }
      const { secrets } = deviceState
      const filtered = secrets.filter(
        ({ kind }) => kind === EncryptedSecretType.TOTP
      )
      return filtered.map((secret) => {
        try {
          const decrypted = cryptoJS.AES.decrypt(
            secret.encrypted,
            deviceState.masterPassword,
            {
              iv: cryptoJS.enc.Utf8.parse(deviceState.userId)
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

    UIConfig
  }

  // @ts-expect-error
  window.backgroundState = backgroundStateContext
  return backgroundStateContext
}
