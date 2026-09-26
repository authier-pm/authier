import { useState, useEffect, useCallback, useMemo } from 'react'
import browser from 'webextension-polyfill'

import {
  IBackgroundStateSerializable,
  IBackgroundStateSerializableLocked
} from '@src/background/backgroundPage'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import {
  backgroundStateSerializableLockedSchema,
  type SecuritySettings
} from '@src/background/backgroundSchemas'
import debug from 'debug'
import {
  device,
  DeviceState,
  getDecryptedSecretProp
} from '@src/background/ExtensionDevice'

import { z, ZodError } from 'zod'
import type { PasskeyData } from '@shared/passkeySchema'
import type { SecretTypeUnion } from '@src/background/ExtensionDevice'
import { getCurrentTab } from './executeScriptInCurrentTab'
import { lockedVaultSnapshotSchema } from '@src/background/lockedVaultStorage'

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

export interface IPasskeySecret extends ISecret {
  passkey: PasskeyData
  kind: EncryptedSecretType.PASSKEY
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

export const pathNameToTypes = {
  '/credentials': [EncryptedSecretType.LOGIN_CREDENTIALS],
  '/totps': [EncryptedSecretType.TOTP],
  '/passkeys': [EncryptedSecretType.PASSKEY],
  '/': [
    EncryptedSecretType.LOGIN_CREDENTIALS,
    EncryptedSecretType.TOTP,
    EncryptedSecretType.PASSKEY
  ]
}

export function useDeviceState() {
  const [currentTab, setCurrentTab] = useState<browser.Tabs.Tab | null>(null)
  const [currentURL, setCurrentURL] = useState<string>('')

  const [lockedState, setLockedState] =
    useState<IBackgroundStateSerializableLocked | null>(device.lockedState)
  const [deviceState, setDeviceState] = useState<DeviceState | null>(
    device.state
  )
  const [isInitialized, setIsInitialized] = useState(device.isInitialized)
  const [selectedItems, setSelectedItems] = useState<SecretTypeUnion[]>([])

  //TODO move this whole thing into it' own hook
  useEffect(() => {
    let revision = 0
    let disposed = false
    const onStorageChange = async (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'session' || !changes.backgroundState) return
      const currentRevision = ++revision
      if (changes.lockedState) {
        setLockedState(
          changes.lockedState.newValue
            ? lockedVaultSnapshotSchema.parse(changes.lockedState.newValue)
            : null
        )
      }
      const snapshot = changes.backgroundState.newValue
      if (!snapshot) {
        setDeviceState(null)
        return
      }

      // Storage contains ciphertext only. Build a separate in-memory UI snapshot
      // and wait for decryption before rendering the newly logged-in vault.
      const nextState = new DeviceState(
        backgroundStateSerializableLockedSchema.parse(snapshot),
        { listenToStorage: false }
      )
      await nextState.initialized
      if (!disposed && currentRevision === revision) {
        setDeviceState(nextState)
      }
    }

    getCurrentTab().then((tab) => {
      setCurrentTab(tab ?? null)
      setCurrentURL(tab?.url ?? '')
    })

    device.onInitDone(() => {
      if (disposed) return
      setIsInitialized(true)
      if (revision > 0) return
      setDeviceState(device.state)
      if (device.lockedState) {
        setLockedState(device.lockedState)
      }
    })
    browser.storage.onChanged.addListener(onStorageChange)
    log('registered storage change listener')
    return () => {
      disposed = true
      browser.storage.onChanged.removeListener(onStorageChange)
    }
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

  const passkeys = useMemo(
    () =>
      deviceState?.decryptedSecrets.filter(
        (secret): secret is IPasskeySecret =>
          secret.kind === EncryptedSecretType.PASSKEY
      ) ?? [],
    [deviceState?.decryptedSecrets]
  )

  const setSecuritySettings = useCallback(async (config: SecuritySettings) => {
    await device.setDeviceSettings(config)
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
        EncryptedSecretType.TOTP,
        EncryptedSecretType.PASSKEY
      ]
    ) => {
      let secrets = [] as SecretTypeUnion[]

      if (types.includes(EncryptedSecretType.LOGIN_CREDENTIALS)) {
        secrets = secrets.concat(loginCredentials)
      }

      if (types.includes(EncryptedSecretType.TOTP)) {
        secrets = secrets.concat(TOTPSecrets)
      }

      if (types.includes(EncryptedSecretType.PASSKEY)) {
        secrets = secrets.concat(passkeys)
      }

      const normalizedFilterBy = filterBy.toLowerCase()

      secrets = secrets.filter((item) => {
        const label = getDecryptedSecretProp(item, 'label')

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
    [TOTPSecrets, loginCredentials, passkeys]
  )

  const backgroundStateContext = useMemo(
    () => ({
      currentURL,
      deviceState,
      currentTab,
      loginCredentials,
      TOTPSecrets,
      passkeys,
      setSecuritySettings,
      setDeviceState: saveDeviceState,
      lockedState,
      device,
      searchSecrets,
      selectedItems,
      setSelectedItems,
      isInitialized
    }),
    [
      TOTPSecrets,
      passkeys,
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
