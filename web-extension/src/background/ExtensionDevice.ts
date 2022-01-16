import debug from 'debug'
import browser from 'webextension-polyfill'
import bowser from 'bowser'
import cryptoJS from 'crypto-js'
import { BackgroundMessageType } from './BackgroundMessageType'
import { removeToken } from '@src/util/accessTokenExtension'
import {
  IBackgroundStateSerializable,
  IBackgroundStateSerializableLocked,
  SecretSerializedType
} from './backgroundPage'
import { generateFireToken } from './generateFireToken'
import {
  EncryptedSecretPatchInput,
  EncryptedSecretType
} from '../../../shared/generated/graphqlBaseTypes'
import { apolloClient } from '@src/apollo/apolloClient'
import {
  AddEncryptedSecretDocument,
  AddEncryptedSecretMutation,
  AddEncryptedSecretMutationVariables
} from './backgroundPage.codegen'
import {
  SyncEncryptedSecretsDocument,
  SyncEncryptedSecretsQuery,
  SyncEncryptedSecretsQueryVariables,
  MarkAsSyncedMutation,
  MarkAsSyncedMutationVariables,
  MarkAsSyncedDocument,
  LogoutDocument,
  LogoutMutation,
  LogoutMutationVariables
} from './ExtensionDevice.codegen'

import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { loginCredentialsSchema } from '@src/util/loginCredentialsSchema'
import { generateEncryptionKey } from '@src/util/generateEncryptionKey'

export const log = debug('au:Device')

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
}

const browserInfo = bowser.getParser(navigator.userAgent)
export const isRunningInBgPage = location.href.includes(
  '_generated_background_page.html'
)
const isVault = location.href.includes('vault.html')
const isPopup = location.href.includes('popup.html')

async function rerenderViewInThisRuntime() {
  if (isVault) {
    const index = await import('@src/vault-index')
    index.renderVault()
  } else if (isPopup) {
    const index = await import('..')
    index.renderPopup()
  }
}

export class DeviceState {
  constructor(parameters: IBackgroundStateSerializable) {
    Object.assign(this, parameters)
    log('device state created', this)

    browser.storage.onChanged.addListener(this.onStorageChange)
  }
  email: string
  userId: string
  encryptionSalt: string
  masterEncryptionKey: string
  secrets: Array<SecretSerializedType>
  lockTime = 10000 * 60 * 60 * 8

  onStorageChange(
    changes: Record<string, browser.Storage.StorageChange>,
    areaName: string
  ) {
    log('storage changed', changes, areaName)
    if (areaName === 'local' && changes.backgroundState) {
      Object.assign(this, changes.backgroundState.newValue)
    }
  }

  setMasterEncryptionKey(masterPassword: string) {
    this.masterEncryptionKey = generateEncryptionKey(
      masterPassword,
      this.encryptionSalt
    )
    this.save()
  }

  encrypt(stringToEncrypt: string) {
    return cryptoJS.AES.encrypt(stringToEncrypt, this.masterEncryptionKey, {
      iv: cryptoJS.enc.Utf8.parse(this.userId)
    }).toString()
  }
  decrypt(encrypted: string) {
    return cryptoJS.AES.decrypt(encrypted, this.masterEncryptionKey, {
      iv: cryptoJS.enc.Utf8.parse(this.userId)
    }).toString(cryptoJS.enc.Utf8)
  }

  async save() {
    log('saving device state', this)
    browser.storage.onChanged.removeListener(this.onStorageChange)
    await browser.storage.local.set({ backgroundState: this })
    browser.storage.onChanged.addListener(this.onStorageChange)
  }

  getSecretDecryptedById(id: string) {
    const secret: ILoginSecret | ITOTPSecret = this.secrets.find(
      (secret) => secret.id === id
    ) as ILoginSecret | ITOTPSecret
    if (secret) {
      return this.decryptSecret(secret)
    }
  }

  getSecretsDecryptedByHostname(host: string) {
    const secrets = this.secrets.filter(
      (secret) => host === new URL(secret.url ?? '').hostname
    ) as Array<ILoginSecret | ITOTPSecret>
    if (secrets) {
      return secrets.map((secret) => {
        return this.decryptSecret(secret)
      })
    }
    return []
  }

  private decryptSecret(secret: ILoginSecret | ITOTPSecret) {
    const decrypted = this.decrypt(secret.encrypted)
    if (secret.kind === EncryptedSecretType.TOTP) {
      secret.totp = decrypted
    } else if (secret.kind === EncryptedSecretType.LOGIN_CREDENTIALS) {
      const parsed = JSON.parse(decrypted)

      try {
        loginCredentialsSchema.parse(parsed)
        secret.loginCredentials = parsed
      } catch (err: any) {
        secret.loginCredentials = {
          username: '',
          password: '',
          parseError: err
        }
      }
    }

    return secret
  }

  /**
   * fetches newly added/deleted/updated secrets from the backend and updates the device state
   */
  async backendSync() {
    const { data } = await apolloClient.query<
      SyncEncryptedSecretsQuery,
      SyncEncryptedSecretsQueryVariables
    >({
      query: SyncEncryptedSecretsDocument
    })
    if (data) {
      const deviceState = device.state
      if (data && deviceState) {
        const removedSecrets = data.currentDevice.encryptedSecretsToSync.filter(
          ({ deletedAt }) => deletedAt
        )
        const newAndUpdatedSecrets =
          data.currentDevice.encryptedSecretsToSync.filter(
            ({ updatedAt }) => !updatedAt
          )

        const oldSecretsWithoutRemoved = deviceState.secrets.filter(
          ({ id }) =>
            !removedSecrets.find((removedSecret) => id === removedSecret.id)
        )

        deviceState.secrets = [
          ...oldSecretsWithoutRemoved,
          ...newAndUpdatedSecrets
        ]

        await this.save()

        await apolloClient.mutate<
          MarkAsSyncedMutation,
          MarkAsSyncedMutationVariables
        >({ mutation: MarkAsSyncedDocument })
      }
    }
  }

  /**
   * invokes the backend mutation and pushes the new secret to the bgState
   * @param secret
   * @returns the added secret
   */
  async addSecret(secret) {
    const stringToEncrypt =
      secret.kind === EncryptedSecretType.TOTP
        ? secret.totp
        : JSON.stringify(secret.loginCredentials)

    const encrypted = this.encrypt(stringToEncrypt)

    const { data } = await apolloClient.mutate<
      AddEncryptedSecretMutation,
      AddEncryptedSecretMutationVariables
    >({
      mutation: AddEncryptedSecretDocument,
      variables: {
        payload: {
          encrypted,
          kind: secret.kind,
          label: secret.label,
          iconUrl: secret.iconUrl,
          url: secret.url
        }
      }
    })
    if (!data) {
      throw new Error('failed to save secret')
    }
    log('saved secret to the backend', secret)
    const secretAdded = data.me.addEncryptedSecret

    this.secrets.push(secretAdded)
    await this.save()
    return secretAdded
  }

  destroy() {
    browser.storage.onChanged.removeListener(this.onStorageChange)
  }
}

class ExtensionDevice {
  state: DeviceState | null = null
  fireToken: string | null = null
  lockedState: IBackgroundStateSerializableLocked

  /**
   * runs on startup
   */
  async initialize() {
    let storedState = null

    if (isRunningInBgPage === false) {
      //this is popup or vault

      browser.runtime.onMessage.addListener(async (msg) => {
        if (msg.action === BackgroundMessageType.rerenderViews) {
          await rerenderViewInThisRuntime()
        }
      })
    }

    const storage = await browser.storage.local.get()
    if (storage.backgroundState) {
      storedState = storage.backgroundState
      log('device state init from storage', storedState)
    } else if (storage.lockedState) {
      this.lockedState = storage.lockedState
      log('device state locked', this.lockedState)
    }

    if (storedState) {
      this.state = new DeviceState(storedState)
    } else {
      this.listenForUserLogin()
    }

    const fireToken = await generateFireToken()
    console.log('~ fireToken', fireToken)
    this.fireToken = fireToken

    this.rerenderViews() // for letting vault/popup know that the state has changed
  }

  private listenForUserLogin() {
    this.state = null
    const onStorageChange = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      log('storage changed', changes, areaName)
      if (areaName === 'local' && changes.backgroundState) {
        this.state = new DeviceState(changes.backgroundState.newValue)
        browser.storage.onChanged.removeListener(onStorageChange)
      }
    }
    browser.storage.onChanged.addListener(onStorageChange)
  }

  rerenderViews() {
    if (isRunningInBgPage === false) {
      rerenderViewInThisRuntime()

      browser.runtime.sendMessage({
        action: BackgroundMessageType.rerenderViews
      })
    }
  }

  generateDeviceName(): string {
    return `${browserInfo.getOSName()} ${browserInfo.getBrowserName()} extension`
  }

  async clearLocalStorage() {
    const deviceId = await this.getDeviceId()
    this.state?.destroy()
    await browser.storage.local.clear()
    this.state = null

    await browser.storage.local.set({ deviceId: deviceId }) // restore deviceId so that we keep it even after logout
  }
  /**
   * @returns a stored deviceId or a new UUID if the extension was just installed
   */
  async getDeviceId() {
    const storage = await browser.storage.local.get('deviceId')
    if (!storage.deviceId) {
      const deviceId = crypto.randomUUID()
      browser.storage.local.set({ deviceId: deviceId })
      log('deviceId', deviceId)
      return deviceId
    } else {
      log('deviceId', storage.deviceId)
      return storage.deviceId
    }
  }

  generateBackendSecret() {
    const lengthMultiplier = getRandomInt(1, 10)
    let secret = ''
    for (let i = 0; i < lengthMultiplier; i++) {
      secret += Math.random().toString(36).substr(2, 20)
    }
    return secret
  }

  getAddDeviceSecretAuthParams(masterEncryptionKey: string, userId: string) {
    const addDeviceSecret = this.generateBackendSecret()

    const addDeviceSecretEncrypted = cryptoJS.AES.encrypt(
      addDeviceSecret,
      masterEncryptionKey,
      {
        iv: cryptoJS.enc.Utf8.parse(userId)
      }
    ).toString()
    return {
      addDeviceSecret,
      addDeviceSecretEncrypted
    }
  }

  async lock() {
    if (!this.state) {
      return
    }
    log('locking device')

    const { email, userId, secrets, encryptionSalt } = this.state

    this.lockedState = { email, userId, secrets, encryptionSalt }
    await browser.storage.local.set({
      deviceId: this.getDeviceId(),
      lockedState: this.lockedState,
      backgroundState: null
    }) // restore deviceId so that we keep it even after logout
    this.state.destroy()

    this.state = null

    this.rerenderViews()
  }

  async logout() {
    await apolloClient.mutate<LogoutMutation, LogoutMutationVariables>({
      mutation: LogoutDocument
    })

    await removeToken()
    await device.clearLocalStorage()

    // this.rerenderViews() // TODO figure out if we can have logout without full extensions reload
    // this.listenForUserLogin()
    browser.runtime.reload()
  }

  serializeSecrets(
    secrets: SecretSerializedType[],
    newPsw: string
  ): EncryptedSecretPatchInput[] {
    const state = this.state
    if (!state) {
      throw new Error('device not initialized')
    }
    return secrets.map((secret) => {
      const { id, encrypted, kind, label, iconUrl, url } = secret
      const decr = state.decrypt(encrypted)
      log('decrypted secret', decr)
      state.setMasterEncryptionKey(newPsw)
      const enc = state.encrypt(decr as string)
      log('encrypted secret', enc, state.masterEncryptionKey)
      return {
        id,
        encrypted: enc as string,
        kind,
        label,
        iconUrl: iconUrl as string,
        url: url as string,
        androidUri: null,
        iosUri: null
      }
    })
  }
}

export const device = new ExtensionDevice()

device.initialize()
// @ts-expect-error
window.extensionDevice = device
