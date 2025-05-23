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
import {
  device,
  DeviceState,
  getDecryptedSecretProp
} from '@src/background/ExtensionDevice'

import { z, ZodError } from 'zod'
import { getCurrentTab } from './executeScriptInCurrentTab'

import {
  totpSchema,
  loginCredentialsSchema
} from '@shared/loginCredentialsSchema'

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

let storageOnchangeListenerRegistered = false // we need to only register once

export const pathNameToTypes = {
  '/credentials': [EncryptedSecretType.LOGIN_CREDENTIALS],
  '/totps': [EncryptedSecretType.TOTP],
  '/': [EncryptedSecretType.LOGIN_CREDENTIALS, EncryptedSecretType.TOTP]
}

export function useDeviceState() {
  const [currentTab, setCurrentTab] = useState<browser.Tabs.Tab | null>(null)
  const [currentURL, setCurrentURL] = useState<string>('')

  const [lockedState, setLockedState] =
    useState<IBackgroundStateSerializableLocked | null>(device.lockedState)
  const [deviceState, setDeviceState] = useState<DeviceState | null>(
    device.state
  )
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [selectedItems, setSelectedItems] = useState<
    (ILoginSecret | ITOTPSecret)[]
  >([])

  const onStorageChange = async (
    changes: Record<string, browser.Storage.StorageChange>,
    areaName: string
  ): Promise<void> => {
    log('onStorageChange', areaName, changes)
    //WARNING: Not sure if this condition is correct
    if (areaName === 'local' && changes.backgroundState) {
      setDeviceState(changes.backgroundState.newValue as DeviceState)
      if (changes.lockedState) {
        setLockedState(changes.lockedState.newValue as DeviceState)
      }

      log('states loaded from storage')
    }
  }

  //TODO move this whole thing into it' own hook
  useEffect(() => {
    getCurrentTab().then((tab) => {
      setCurrentTab(tab ?? null)
      setCurrentURL(tab?.url ?? '')
    })

    device.onInitDone(() => {
      console.log('device.onInitDone')
      setDeviceState(device.state)
      if (device.lockedState) {
        setLockedState(device.lockedState)
      }
      setIsInitialized(true)
    })
    if (storageOnchangeListenerRegistered) {
      console.log('storage change listener already registered')
      return
    }
    browser.storage.onChanged.addListener(onStorageChange)
    storageOnchangeListenerRegistered = true
    log('registered storage change listener')
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
      device.setDeviceSettings(config)
    },
    setDeviceState: async (state: IBackgroundStateSerializable) => {
      device.save(state)
    },
    lockedState,
    device,
    registered: storageOnchangeListenerRegistered,
    /*
     * searches for secrets in the vault, tries to include all fields which can be searched, returns sorted by lastUsedAt
     */
    searchSecrets: (
      filterBy: string,
      types = [EncryptedSecretType.LOGIN_CREDENTIALS, EncryptedSecretType.TOTP]
    ) => {
      const { loginCredentials, TOTPSecrets } = backgroundStateContext
      let secrets = [] as (ILoginSecret | ITOTPSecret)[]

      if (types.includes(EncryptedSecretType.LOGIN_CREDENTIALS)) {
        secrets = secrets.concat(loginCredentials)
      }

      if (types.includes(EncryptedSecretType.TOTP)) {
        secrets = secrets.concat(TOTPSecrets)
      }
      secrets = secrets.filter((item) => {
        const label =
          (item.kind === EncryptedSecretType.TOTP
            ? item.totp.label
            : item.loginCredentials.label) ?? ''

        const username = getDecryptedSecretProp(item, 'username')
        const url = getDecryptedSecretProp(item, 'url')
        return (
          label.includes(filterBy) ||
          label.toLowerCase().includes(filterBy.toLowerCase()) ||
          url.includes(filterBy) ||
          url.toLowerCase().includes(filterBy.toLowerCase()) ||
          username.includes(filterBy) ||
          username.toLowerCase().includes(filterBy.toLowerCase()) ||
          getDecryptedSecretProp(item, 'password').includes(filterBy) // make sure user can search by password. This can be useful for searching where a concrete password is used
        )
      })
      console.log('secrets', secrets)
      return secrets.sort((a, b) =>
        (a.lastUsedAt ?? a.createdAt) >= (b.lastUsedAt ?? b.createdAt) ? -1 : 1
      )
    },
    selectedItems,
    setSelectedItems,
    isInitialized
  }

  window['backgroundState'] = backgroundStateContext
  return backgroundStateContext
}
