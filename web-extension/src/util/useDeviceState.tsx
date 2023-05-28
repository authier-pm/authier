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

import { getTRPCCached } from '@src/content-script/connectTRPC'
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
  const [tableView, setTableView] = useState<boolean>(false)

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
    })
    if (storageOnchangeListenerRegistered) {
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
          url.includes(filterBy) ||
          username.includes(filterBy) ||
          getDecryptedSecretProp(item, 'password').includes(filterBy) // make sure user can search by password. This can be useful for searching where a concrete password is used
        )
      })

      return secrets.sort((a, b) =>
        (a.lastUsedAt ?? a.createdAt) >= (b.lastUsedAt ?? b.createdAt) ? 1 : -1
      )
    },
    setTableView,
    tableView
  }

  window['backgroundState'] = backgroundStateContext
  return backgroundStateContext
}
