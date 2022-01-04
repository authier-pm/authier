import debug from 'debug'
import browser from 'webextension-polyfill'
import Bowser from 'bowser'
import cryptoJS from 'crypto-js'
import { BackgroundMessageType } from './BackgroundMessageType'
import { removeToken } from '@src/util/accessTokenExtension'
import { renderPopup } from '..'
import {
  IBackgroundStateSerializable,
  SecretSerializedType
} from './backgroundPage'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { apolloClient } from '@src/apollo/apolloClient'
import {
  AddEncryptedSecretDocument,
  AddEncryptedSecretMutation,
  AddEncryptedSecretMutationVariables
} from './backgroundPage.codegen'

export const log = debug('au:Device')

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
}

const browserInfo = Bowser.getParser(navigator.userAgent)

class DeviceState {
  constructor(parameters: IBackgroundStateSerializable) {
    Object.assign(this, parameters)
    browser.storage.onChanged.addListener(this.onStorageChange)
  }
  email: string
  userId: string
  fireToken: string
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
    return secretAdded
  }
}

class ExtensionDevice {
  state: DeviceState | null = null
  async initialize() {
    const storage = await browser.storage.local.get()
    if (storage.backgroundState) {
      this.state = new DeviceState(storage.backgroundState)

      log('device state init from storage', this.state)
    }
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

  async logout() {
    await removeToken()
    await device.clearLocalStorage()
    browser.runtime.sendMessage({
      action: BackgroundMessageType.clear
    })

    renderPopup()
  }
}

export const device = new ExtensionDevice()
device.initialize()
