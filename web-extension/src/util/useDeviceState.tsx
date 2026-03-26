import { useState, useEffect, useCallback, useMemo } from 'react'
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
      setDeviceState(device.state)
      if (device.lockedState) {
        setLockedState(device.lockedState)
      }
      setIsInitialized(true)
    })
    if (storageOnchangeListenerRegistered) {
      return
    }
    browser.storage.onChanged.addListener(onStorageChange)
    storageOnchangeListenerRegistered = true
    log('registered storage change listener')
  }, [])

  const loginCredentials = useMemo(
    () =>
      (deviceState?.decryptedSecrets.filter(({ kind }) => {
        return kind === EncryptedSecretType.LOGIN_CREDENTIALS
      }) ?? []) as ILoginSecret[],
    [deviceState?.decryptedSecrets]
  )

  const TOTPSecrets = useMemo(
    () =>
      (deviceState?.decryptedSecrets.filter(({ kind }) => {
        return kind === EncryptedSecretType.TOTP
      }) ?? []) as ITOTPSecret[],
    [deviceState?.decryptedSecrets]
  )

  const setSecuritySettings = useCallback(async (config: SettingsInput) => {
    device.setDeviceSettings(config)
  }, [])

  const saveDeviceState = useCallback(
    async (state: IBackgroundStateSerializable) => {
      device.save(state)
    },
    []
  )

  const searchSecrets = useCallback(
    (
      filterBy: string,
      types = [
        EncryptedSecretType.LOGIN_CREDENTIALS,
        EncryptedSecretType.TOTP
      ]
    ) => {
      let secrets = [] as (ILoginSecret | ITOTPSecret)[]

      if (types.includes(EncryptedSecretType.LOGIN_CREDENTIALS)) {
        secrets = secrets.concat(loginCredentials)
      }

      if (types.includes(EncryptedSecretType.TOTP)) {
        secrets = secrets.concat(TOTPSecrets)
      }

      const normalizedFilterBy = filterBy.toLowerCase()

      secrets = secrets.filter((item) => {
        const label =
          (item.kind === EncryptedSecretType.TOTP
            ? item.totp.label
            : item.loginCredentials.label) ?? ''

        const username = getDecryptedSecretProp(item, 'username')
        const url = getDecryptedSecretProp(item, 'url')
        const password = getDecryptedSecretProp(item, 'password')

        return (
          label.includes(filterBy) ||
          label.toLowerCase().includes(normalizedFilterBy) ||
          url.includes(filterBy) ||
          url.toLowerCase().includes(normalizedFilterBy) ||
          username.includes(filterBy) ||
          username.toLowerCase().includes(normalizedFilterBy) ||
          password.includes(filterBy)
        )
      })

      return secrets.sort((a, b) =>
        (a.lastUsedAt ?? a.createdAt) >= (b.lastUsedAt ?? b.createdAt) ? -1 : 1
      )
    },
    [TOTPSecrets, loginCredentials]
  )

  const backgroundStateContext = useMemo(
    () => ({
      currentURL,
      deviceState,
      currentTab,
      loginCredentials,
      TOTPSecrets,
      setSecuritySettings,
      setDeviceState: saveDeviceState,
      lockedState,
      device,
      registered: storageOnchangeListenerRegistered,
      searchSecrets,
      selectedItems,
      setSelectedItems,
      isInitialized
    }),
    [
      TOTPSecrets,
      currentTab,
      currentURL,
      deviceState,
      isInitialized,
      lockedState,
      loginCredentials,
      saveDeviceState,
      searchSecrets,
      selectedItems,
      setSecuritySettings
    ]
  )

  window['backgroundState'] = backgroundStateContext
  return backgroundStateContext
}
