import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { useState, useEffect } from 'react'
import browser from 'webextension-polyfill'

import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import {
  EncryptedSecretType,
  SettingsInput
} from '../../../shared/generated/graphqlBaseTypes'
import debug from 'debug'
import { device, DeviceState } from '@src/background/ExtensionDevice'
import { loginCredentialsSchema, totpSchema } from './loginCredentialsSchema'
import { z, ZodError } from 'zod'
import { getCurrentTab } from './executeScriptInCurrentTab'

const log = debug('au:useDeviceState')

export interface ISecret {
  id: string
  encrypted: string
  lastUsedAt?: string | null
  createdAt: string
  kind: EncryptedSecretType
}
export type TotpTypeWithMeta = z.infer<typeof totpSchema>

export interface ITOTPSecret extends ISecret {
  totp: TotpTypeWithMeta
  kind: EncryptedSecretType.TOTP
}

export type LoginCredentialsTypeWithMeta = z.infer<
  typeof loginCredentialsSchema
> & {
  parseError?: ZodError | Error
}

export interface ILoginSecret extends ISecret {
  loginCredentials: LoginCredentialsTypeWithMeta
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
  const [currentTab, setCurrentTab] = useState<browser.Tabs.Tab | null>(null)
  const [currentURL, setCurrentURL] = useState<string>('')
  const [isFilling, setIsFilling] = useState<boolean>(false)

  const [deviceState, setDeviceState] = useState<DeviceState | null>(
    device.state
  )

  const onStorageChange = async (
    changes: Record<string, browser.Storage.StorageChange>,
    areaName: string
  ): Promise<void> => {
    log('onStorageChange useDevice', areaName, changes)
    if (areaName === 'local' && changes.backgroundState) {
      setDeviceState(changes.backgroundState.newValue)

      log('states loaded from storage')
    }
  }

  //TODO move this whole thing into it' own hook
  useEffect(() => {
    log('registering storage change listener')

    getCurrentTab().then((tab) => {
      setCurrentTab(tab ?? null)
      setCurrentURL(tab?.url ?? '')
    })

    if (registered) {
      return
    }
    registered = true

    browser.storage.onChanged.addListener(onStorageChange)
  }, [])

  const backgroundStateContext = {
    currentURL,
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

    setSecuritySettings: async (config: SettingsInput) => {
      browser.runtime.sendMessage({
        action: BackgroundMessageType.securitySettings,
        settings: config
      })
    },

    setDeviceState: (state: IBackgroundStateSerializable) => {
      device.save(state)
      browser.runtime.sendMessage({
        action: BackgroundMessageType.setDeviceState,
        state: state
      })
    },
    device,
    isFilling,
    registered
  }

  window['backgroundState'] = backgroundStateContext
  return backgroundStateContext
}
