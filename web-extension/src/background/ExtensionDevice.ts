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
import {
  EncryptedSecretPatchInput,
  EncryptedSecretType,
  SettingsInput
} from '../../../shared/generated/graphqlBaseTypes'
import { apolloClient } from '@src/apollo/apolloClient'
import {
  AddEncryptedSecretsDocument,
  AddEncryptedSecretsMutation,
  AddEncryptedSecretsMutationVariables
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
import { toast } from 'react-toastify'

export const log = debug('au:Device')

const getTldPart = (url: string) => {
  const host = new URL(url ?? '').hostname
  const parts = host.split('.')
  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
}

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
type SecretTypeUnion = ILoginSecret | ITOTPSecret

const isLoginSecret = (secret: SecretTypeUnion): secret is ILoginSecret =>
  'loginCredentials' in secret

const isTotpSecret = (secret: SecretTypeUnion): secret is ITOTPSecret =>
  'totp' in secret

export type AddSecretInput = Array<
  Omit<SecretSerializedType, 'id'> & {
    totp?: any
    loginCredentials?: any
  }
>

export class DeviceState implements IBackgroundStateSerializable {
  decryptedSecrets: (ILoginSecret | ITOTPSecret)[]
  constructor(parameters: IBackgroundStateSerializable) {
    Object.assign(this, parameters)
    //log('device state created', this)

    browser.storage.onChanged.addListener(this.onStorageChange)
    this.decryptedSecrets = this.getAllSecretsDecrypted()
  }

  email: string
  userId: string
  deviceName: string

  encryptionSalt: string
  masterEncryptionKey: string
  secrets: Array<SecretSerializedType>
  lockTime: number
  autofill: boolean
  language: string
  theme: string
  syncTOTP: boolean
  authSecret: string
  authSecretEncrypted: string

  onStorageChange(
    changes: Record<string, browser.Storage.StorageChange>,
    areaName: string
  ) {
    log('storage changed', changes, areaName)
    if (areaName === 'local' && changes.backgroundState && device.state) {
      Object.assign(device.state, changes.backgroundState.newValue)
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
    browser.storage.onChanged.removeListener(this.onStorageChange)
    device.lockedState = null
    this.decryptedSecrets = this.getAllSecretsDecrypted()
    console.log('SAVE DEVICE STATE', this.decryptedSecrets)
    await browser.storage.local.set({
      backgroundState: this,
      lockedState: null
    })

    browser.storage.onChanged.addListener(this.onStorageChange)
  }

  getSecretDecryptedById(id: string) {
    const secret = this.decryptedSecrets.find((secret) => secret.id === id)
    if (secret) {
      return this.decryptSecret(secret)
    }
  }

  getSecretsDecryptedByHostname(host: string) {
    let secrets = this.decryptedSecrets.filter(
      (secret) => host === new URL(secret.id ?? '').hostname
    )
    if (secrets.length === 0) {
      secrets = this.decryptedSecrets.filter((secret) =>
        host.endsWith(getTldPart(secret.url ?? ''))
      )
    }
    return secrets.map((secret) => {
      return this.decryptSecret(secret)
    })
  }

  getAllSecretsDecrypted() {
    return this.secrets.map((secret) => {
      return this.decryptSecret(secret)
    })
  }

  private decryptSecret(secret: SecretSerializedType) {
    const decrypted = this.decrypt(secret.encrypted)
    let secretDecrypted: ILoginSecret | ITOTPSecret
    if (secret.kind === EncryptedSecretType.TOTP) {
      secretDecrypted = {
        ...secret,
        totp: decrypted
      } as ITOTPSecret
    } else if (secret.kind === EncryptedSecretType.LOGIN_CREDENTIALS) {
      const parsed = JSON.parse(decrypted)

      try {
        loginCredentialsSchema.parse(parsed.loginCredentials)
        secretDecrypted = {
          ...parsed,
          ...secret
        } as ILoginSecret
      } catch (err: unknown) {
        secretDecrypted = {
          ...secret,
          label: parsed.label,
          url: parsed.url,
          loginCredentials: {
            username: '',
            password: '',
            parseError: err as Error
          }
        } as ILoginSecret
      }
    } else {
      throw new Error('Unknown secret type')
    }

    return secretDecrypted
  }

  /**
   * fetches newly added/deleted/updated secrets from the backend and updates the device state
   */
  async backendSync() {
    const { data } = await apolloClient.query<
      SyncEncryptedSecretsQuery,
      SyncEncryptedSecretsQueryVariables
    >({
      query: SyncEncryptedSecretsDocument,
      fetchPolicy: 'no-cache'
    })
    if (data) {
      const deviceState = device.state
      if (data && deviceState) {
        const backendRemovedSecrets =
          data.currentDevice.encryptedSecretsToSync.filter(
            ({ deletedAt }) => deletedAt
          )
        const newAndUpdatedSecrets =
          data.currentDevice.encryptedSecretsToSync.filter(
            ({ deletedAt }) => !deletedAt
          )

        const secretsBeforeSync = deviceState.secrets
        const unchangedSecrets = secretsBeforeSync.filter(
          ({ id }) =>
            !backendRemovedSecrets.find(
              (removedSecret) => id === removedSecret.id
            ) &&
            !newAndUpdatedSecrets.find(
              (updatedSecret) => id === updatedSecret.id
            )
        )

        deviceState.secrets = [...unchangedSecrets, ...newAndUpdatedSecrets]

        await this.save()

        await apolloClient.mutate<
          MarkAsSyncedMutation,
          MarkAsSyncedMutationVariables
        >({ mutation: MarkAsSyncedDocument })

        const actuallyRemovedOnThisDevice = backendRemovedSecrets.filter(
          ({ id: removedId }) => {
            return secretsBeforeSync.find(({ id }) => removedId === id)
          }
        )
        console.log(
          '~ actuallyRemovedOnThisDevice',
          actuallyRemovedOnThisDevice
        )
        return {
          removedSecrets: actuallyRemovedOnThisDevice.length,
          newAndUpdatedSecrets: newAndUpdatedSecrets.length
        }
      }
    }
  }

  findExistingSecret(secret) {
    const existingSecretsOnHostname = this.getSecretsDecryptedByHostname(
      new URL(secret.url).hostname
    )

    return existingSecretsOnHostname.find(
      (s) =>
        (isLoginSecret(s) &&
          s.loginCredentials.username === secret.loginCredentials?.username) ||
        (isTotpSecret(s) && s.totp === secret.totp)
    )
  }

  /**
   * invokes the backend mutation and pushes the new secret to the bgState
   * @param secrets
   * @returns the added secret
   */
  async addSecrets(secrets: AddSecretInput) {
    // const existingSecret = this.findExistingSecret(secrets)
    // if (existingSecret) {
    //   return null
    // }

    const { data } = await apolloClient.mutate<
      AddEncryptedSecretsMutation,
      AddEncryptedSecretsMutationVariables
    >({
      mutation: AddEncryptedSecretsDocument,
      variables: {
        secrets: secrets.map((secret) => {
          const stringToEncrypt =
            secret.kind === EncryptedSecretType.TOTP
              ? JSON.stringify(secret.totp)
              : JSON.stringify(secret.loginCredentials)

          const encrypted = this.encrypt(stringToEncrypt as string)

          return {
            encrypted,
            kind: secret.kind
          }
        })
      }
    })
    if (!data) {
      throw new Error('failed to save secret')
    }
    log('saved secret to the backend', secrets)
    const secretsAdded = data.me.addEncryptedSecrets

    this.secrets.push(...secretsAdded)
    await this.save()
    return secretsAdded
  }

  async removeSecret(secretId: string) {
    browser.storage.local.set({
      backgroundState: {
        ...device.state,
        secrets: device.state?.secrets.filter((s) => s.id !== secretId)
      }
    })
    this.secrets = this.secrets.filter((s) => s.id !== secretId)
    console.log('removed secret', secretId)
    this.save()
  }

  destroy() {
    browser.storage.onChanged.removeListener(this.onStorageChange)
  }
}

class ExtensionDevice {
  state: DeviceState | null = null
  fireToken: string | null = null
  lockedState: IBackgroundStateSerializableLocked | null = null
  id: string | null = null
  name: string

  async startLockInterval(lockTime: number) {
    await chrome.runtime.sendMessage({
      action: BackgroundMessageType.setLockInterval,
      time: lockTime
    })
  }

  async clearLockInterval() {
    await chrome.runtime.sendMessage({
      action: BackgroundMessageType.clearLockInterval
    })
  }

  get platform() {
    return browserInfo.getOSName()
  }
  /**
   * runs on startup
   */
  async initialize() {
    log('Extension device initializing')
    this.id = await this.getDeviceId()

    let storedState: IBackgroundStateSerializable | null = null

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
      this.name = storedState.deviceName
      this.state.save()
    } else {
      this.name = this.generateDeviceName()
      this.listenForUserLogin()
    }

    if (this.state) {
      this.startLockInterval(this.state.lockTime)
    }

    // const fireToken = await generateFireToken()
    const fireToken = 'aaaa'

    this.fireToken = fireToken

    this.rerenderViews() // for letting vault/popup know that the state has changed
  }

  private listenForUserLogin() {
    this.state = null
    const onStorageChangeLogin = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      log('storage change UL', changes, areaName)
      if (areaName === 'local' && changes.backgroundState) {
        this.state = new DeviceState(changes.backgroundState.newValue)
        browser.storage.onChanged.removeListener(onStorageChangeLogin)
      } else if (areaName === 'local' && changes.lockedState) {
        this.lockedState = changes.lockedState.newValue
        browser.storage.onChanged.removeListener(onStorageChangeLogin)
      }
    }
    browser.storage.onChanged.addListener(onStorageChangeLogin)
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
      await browser.storage.local.set({ deviceId: deviceId })
      log('Creating new deviceID', deviceId)
      return deviceId
    } else {
      log('Got deviceID', storage.deviceId)
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

  initLocalDeviceAuthSecret(masterEncryptionKey: string, userId: string) {
    const authSecret = this.generateBackendSecret()

    const addDeviceSecret = cryptoJS.AES.encrypt(
      authSecret,
      masterEncryptionKey,
      {
        iv: cryptoJS.enc.Utf8.parse(userId)
      }
    ).toString()

    return {
      addDeviceSecret: authSecret,
      addDeviceSecretEncrypted: addDeviceSecret
    }
  }

  async lock() {
    if (!this.state) {
      throw new Error('no state to lock')
    }

    this.clearLockInterval()

    log('locking device')

    const {
      email,
      userId,
      secrets,
      encryptionSalt,
      lockTime,
      syncTOTP,
      autofill,
      language,
      theme,
      authSecret,
      authSecretEncrypted
    } = this.state

    this.lockedState = {
      email,
      userId,
      secrets,
      deviceName: this.name,
      encryptionSalt,
      authSecret,
      authSecretEncrypted,
      lockTime,
      syncTOTP,
      autofill,
      language,
      theme
    }
    await browser.storage.local.set({
      lockedState: this.lockedState,
      backgroundState: null
    }) // restore deviceId so that we keep it even after logout
    this.state.destroy()

    this.state = null

    this.rerenderViews()
  }

  async clearAndReload() {
    await removeToken()
    await device.clearLocalStorage()

    device.rerenderViews() // TODO figure out if we can have logout without full extensions reload
    device.listenForUserLogin()
    browser.runtime.reload()
  }

  async logout() {
    try {
      await apolloClient.mutate<LogoutMutation, LogoutMutationVariables>({
        mutation: LogoutDocument
      })
    } catch (err: any) {
      toast.error(
        `There was an error logging out: ${err.message} \n., you will need to deauthorize the device manually in device management.`,
        {
          autoClose: false,
          onClose: () => {
            this.clearAndReload()
          }
        }
      )
    } finally {
      await this.clearAndReload()
    }
    await this.clearAndReload()
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
      const { id, encrypted, kind } = secret
      const decr = state.decrypt(encrypted)
      log('decrypted secret', decr)
      state.setMasterEncryptionKey(newPsw)
      const enc = state.encrypt(decr as string)
      log('encrypted secret', enc, state.masterEncryptionKey)
      return {
        id,
        encrypted: enc as string,
        kind
      }
    })
  }

  syncSettings(config: SettingsInput) {
    if (this.state) {
      this.state.autofill = config.autofill
      this.state.lockTime = config.vaultLockTimeoutSeconds
      this.state.syncTOTP = config.syncTOTP
      this.state.language = config.language
      this.state.theme = config.theme
    }
  }

  async save(deviceState: IBackgroundStateSerializable) {
    this.state = new DeviceState(deviceState)
    this.state.save()
    this.rerenderViews()
  }
}
log('Extension device started')
export const device = new ExtensionDevice()

device.initialize()
// @ts-expect-error TODO fix types
window.extensionDevice = device
