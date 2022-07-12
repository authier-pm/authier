import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { useState, useEffect } from 'react'
import browser from 'webextension-polyfill'
import { useUpdateSettingsMutation } from '@src/pages/Settings.codegen'

import {
  UIOptions,
  UISettings
} from '@src/components/setting-screens/SettingsForm'

import {
  IBackgroundStateSerializable,
  IBackgroundStateSerializableLocked
} from '@src/background/backgroundPage'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import debug from 'debug'
import { device, DeviceState } from '@src/background/ExtensionDevice'
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
  lastUsedAt?: string | null
  createdAt: string
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
  vaultLockTime: string
  autofill: boolean
  language: string
  twoFA: boolean
}

export interface ISecuritySettingsInBg {
  vaultTime: number
  noHandsLogin: boolean
}

let registered = false // we need to only register once

export function useDeviceState() {
  const [currentURL, setCurrentURL] = useState<string>('')

  const [safeLocked, setSafeLocked] =
    useState<IBackgroundStateSerializableLocked | null>(null)

  const [deviceState, setDeviceState] = useState<DeviceState | null>(
    device.state
  )

  const [UIConfig, setUIConfig] = useState<UISettings>({
    homeList: UIOptions.all
  })
  const [updateSettings] = useUpdateSettingsMutation()

  useEffect(() => {
    setDeviceState(device.state)
    setSafeLocked(device.lockedState)
  }, [device.state, device.lockedState])

  const onStorageChange = async (
    changes: Record<string, browser.Storage.StorageChange>,
    areaName: string
  ): Promise<void> => {
    console.log('onStorageChange useDevice', changes, areaName)
    if (areaName === 'local' && changes.backgroundState) {
      setDeviceState(changes.backgroundState.newValue)
      setSafeLocked(changes.lockedState.newValue)
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
    deviceState,
    currentTab,
    get loginCredentials() {
      return (deviceState?.decryptedSecrets.filter(({ kind }) => {
        return kind === EncryptedSecretType.LOGIN_CREDENTIALS
      }) ?? []) as ILoginSecret[]
    },
    get TOTPSecrets() {
      return (deviceState?.decryptedSecrets.filter(({ kind }) => {
        return kind === EncryptedSecretType.TOTP
      }) ?? []) as ITOTPSecret[]
    },

    setSecuritySettings: (config: ISecuritySettings) => {
      updateSettings({
        variables: {
          lockTime: parseInt(config.vaultLockTime),
          autofill: config.autofill,
          twoFA: config.twoFA,
          language: config.language
        }
      })

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
    UIConfig,
    setDeviceState: (state: IBackgroundStateSerializable) => {
      device.save(state)
      browser.runtime.sendMessage({
        action: BackgroundMessageType.setDeviceState,
        state: state
      })
    },
    device
  }

  window['backgroundState'] = backgroundStateContext
  return backgroundStateContext
}
