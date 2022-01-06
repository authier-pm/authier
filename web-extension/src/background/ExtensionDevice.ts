import debug from 'debug'
import browser from 'webextension-polyfill'
import Bowser from 'bowser'
import cryptoJS from 'crypto-js'
import { BackgroundMessageType } from './BackgroundMessageType'
import { removeToken } from '@src/util/accessTokenExtension'
import {
  IBackgroundStateSerializable,
  IBackgroundStateSerializableLocked,
  SecretSerializedType
} from './backgroundPage'
import { generateFireToken } from './generateFireToken'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
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
  MarkAsSyncedDocument
} from './ExtensionDevice.codegen'

import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { loginCredentialsSchema } from '@src/util/loginCredentialsSchema'

export const log = debug('au:Device')

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
}

const browserInfo = Bowser.getParser(navigator.userAgent)
export const isRunningInBgPage = location.href.includes(
  '_generated_background_page.html'
)
const isVault = location.href.includes('vault.html')

async function rerenderViewInThisRuntime() {
  if (isVault) {
    const index = await import('@src/vault-index')
    index.renderVault()
  } else {
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
  masterPassword: string
  secrets: Array<SecretSerializedType>
  lockTime = 10000 * 60 * 60 * 8

  onStorageChange(
    changes: Record<string, browser.Storage.StorageChange>,
    areaName: string
  ) {
    if (areaName === 'local' && changes.backgroundState) {
      Object.assign(this, changes.backgroundState.newValue)
    }
  }

  encrypt(stringToEncrypt: string) {
    return cryptoJS.AES.encrypt(stringToEncrypt, this.masterPassword, {
      iv: cryptoJS.enc.Utf8.parse(this.userId)
    }).toString()
  }
  decrypt(encrypted: string) {
    return cryptoJS.AES.decrypt(encrypted, this.masterPassword, {
      iv: cryptoJS.enc.Utf8.parse(this.userId)
    }).toString(cryptoJS.enc.Utf8)
  }

  async save() {
    browser.storage.onChanged.removeListener(this.onStorageChange)
    await browser.storage.local.set({ backgroundState: this })
    browser.storage.onChanged.addListener(this.onStorageChange)
  }

  getSecretWithDecryptedBit(id: string) {
    const secret: ILoginSecret | ITOTPSecret = this.secrets.find(
      (secret) => secret.id === id
    ) as ILoginSecret | ITOTPSecret
    if (secret) {
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
            ({ deletedAt }) => !deletedAt
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
    } else {
      log('device state not found in storage')
    }

    this.state = storedState ? new DeviceState(storedState) : null

    const fireToken = await generateFireToken()
    console.log('~ fireToken', fireToken)
    this.fireToken = fireToken

    this.rerenderViews() // for letting vault/popup know that the state has changed
  }

  rerenderViews() {
    rerenderViewInThisRuntime()
    browser.runtime.sendMessage({
      action: BackgroundMessageType.rerenderViews
    })
  }

  generateDeviceName(): string {
    return `${browserInfo.getOSName()} ${browserInfo.getBrowserName()} extension`
  }

  async clearLocalStorage() {
    const deviceId = await this.getDeviceId()
    await browser.storage.local.clear()
    await browser.storage.local.set({ deviceId: deviceId }) // restore deviceId so that we keep it even after logout
    this.state = null
  }
  /**
   * @returns a stored deviceId or a new UUID if the extension was just installed
   */
  async getDeviceId() {
    const storage = await browser.storage.local.get('deviceId')
    if (!storage.deviceId) {
      // @ts-expect-error
      const deviceId = crypto.randomUUID()
      browser.storage.local.set({ deviceId: deviceId })
      log('deviceId', deviceId)
      return deviceId
    } else {
      log('deviceId', storage.deviceId)
      return storage.deviceId
    }
  }

  generateAddDeviceSecret() {
    const lengthMultiplier = getRandomInt(1, 10)
    let secret = ''
    for (let i = 0; i < lengthMultiplier; i++) {
      secret += Math.random().toString(36).substr(2, 20)
    }
    return secret
  }

  getAddDeviceSecretAuthTuple(masterPassword: string, userId: string) {
    const addDeviceSecret = this.generateAddDeviceSecret()

    const addDeviceSecretEncrypted = cryptoJS.AES.encrypt(
      addDeviceSecret,
      masterPassword,
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

    const { email, userId, secrets } = this.state

    this.lockedState = { email, userId, secrets }
    this.state = null
    this.rerenderViews()
  }

  async logout() {
    await removeToken()
    await device.clearLocalStorage()

    this.rerenderViews()
  }
}

export const device = new ExtensionDevice()

device.initialize()

// @ts-expect-error
window.extensionDevice = device
