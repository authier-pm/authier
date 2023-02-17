import { useState, useEffect } from 'react'
import browser from 'webextension-polyfill'

import {
  IBackgroundStateSerializable,
  IBackgroundStateSerializableLocked
} from '@src/background/backgroundPage'
import {
  EncryptedSecretType,
  SettingsInput
} from '../../../shared/generated/graphqlBaseTypes'
import debug from 'debug'
import { device, DeviceState } from '@src/background/ExtensionDevice'
import { loginCredentialsSchema, totpSchema } from './loginCredentialsSchema'
import { z, ZodError } from 'zod'
import { getCurrentTab } from './executeScriptInCurrentTab'

import { getTRPCCached } from '@src/content-script/connectTRPC'

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
  const trpc = getTRPCCached()
  const [currentTab, setCurrentTab] = useState<browser.Tabs.Tab | null>(null)
  const [currentURL, setCurrentURL] = useState<string>('')
  const [isFilling, setIsFilling] = useState<boolean>(false)
  const [lockedState, setLockedState] =
    useState<IBackgroundStateSerializableLocked | null>(device.lockedState)
  const [deviceState, setDeviceState] = useState<DeviceState | null>(
    device.state
  )

  const onStorageChange = async (
    changes: Record<string, browser.Storage.StorageChange>,
    areaName: string
  ): Promise<void> => {
    log('onStorageChange', areaName, changes)
    //WARNING: Not sure if this condition is correct
    if (areaName === 'local' && changes.backgroundState) {
      setDeviceState(changes.backgroundState.newValue)
      if (changes.lockedState) {
        setLockedState(changes.lockedState.newValue)
      }

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

    device.onInitDone(() => {
      setDeviceState(device.state)
    })
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
      log('setSecuritySettings', config)
      await trpc.securitySettings.mutate(config)
    },

    setDeviceState: async (state: IBackgroundStateSerializable) => {
      device.save(state)
      await trpc.setDeviceState.mutate(state)
    },
    lockedState,
    device,
    isFilling,
    registered
  }

  window['backgroundState'] = backgroundStateContext
  return backgroundStateContext
}
