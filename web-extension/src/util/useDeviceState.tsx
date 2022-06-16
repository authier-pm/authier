import { SharedBrowserEvents } from '@src/background/SharedBrowserEvents'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { useState, useEffect } from 'react'
import browser from 'webextension-polyfill'
import { useUpdateSettingsMutation } from '@src/pages/Settings.codegen'

import {
  UIOptions,
  UISettings
} from '@src/components/setting-screens/SettingsForm'

import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import cryptoJS from 'crypto-js'
import debug from 'debug'
import { device } from '@src/background/ExtensionDevice'
import { loginCredentialsSchema } from './loginCredentialsSchema'
import { z, ZodError } from 'zod'
import { getCurrentTab } from './executeScriptInCurrentTab'

const log = debug('au:useDeviceState')

export interface ISecret {
  id: string
  encrypted: string
  label: string
  iconUrl: string | undefined | null
  url: string
  lastUsed?: Date | null
  kind: EncryptedSecretType
}
export interface ITOTPSecret extends ISecret {
  totp: string
  kind: EncryptedSecretType.TOTP
}

export interface ILoginSecret extends ISecret {
  loginCredentials: z.infer<typeof loginCredentialsSchema> & {
    parseError?: ZodError | Error
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

  const [safeLocked, setSafeLocked] = useState<boolean>(false)

  const [isFilling, setIsFilling] = useState<boolean>(false)
  const [isCounting, setIsCounting] = useState<boolean>(false)
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

    browser.storage.onChanged.addListener(onStorageChange)
  }, [])

  const [currentTab, setCurrentTab] = useState<browser.Tabs.Tab | null>(null)

  useEffect(() => {
    getCurrentTab().then((tab) => {
      setCurrentTab(tab ?? null)
      setCurrentURL(tab?.url ?? '')
    })
  }, [])

  const backgroundStateContext = {
    currentURL,
    safeLocked,
    setSafeLocked,
    isFilling,
    deviceState,
    currentTab,
    get LoginCredentials() {
      if (!deviceState) {
        return []
      }
      const { secrets } = deviceState
      const filtered = secrets.filter(
        ({ kind }) => kind === EncryptedSecretType.LOGIN_CREDENTIALS
      )
      const creds = filtered.map((secret) => {
        let parsed

        try {
          const decrypted = cryptoJS.AES.decrypt(
            secret.encrypted,
            deviceState.masterEncryptionKey,
            {
              iv: cryptoJS.enc.Utf8.parse(deviceState.userId)
            }
          ).toString(cryptoJS.enc.Utf8)

          parsed = JSON.parse(decrypted)

          loginCredentialsSchema.parse(parsed)

          return {
            ...secret,
            loginCredentials: parsed
          }
        } catch (err) {
          parsed && log('parsed', parsed)

          return {
            ...secret,
            loginCredentials: {
              username: '',
              password: ''
            }
          }
        }
      })
      return creds
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
            deviceState.masterEncryptionKey,
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
          console.error(`decryption failed for totp secret ${secret.id}}`)
          return {
            ...secret,
            totp: ''
          }
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

  window['backgroundState'] = backgroundStateContext
  return backgroundStateContext
}
