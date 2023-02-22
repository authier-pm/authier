import debug from 'debug'
import browser from 'webextension-polyfill'
import bowser from 'bowser'
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
  SyncEncryptedSecretsDocument,
  SyncEncryptedSecretsQuery,
  SyncEncryptedSecretsQueryVariables,
  MarkAsSyncedMutation,
  MarkAsSyncedMutationVariables,
  MarkAsSyncedDocument,
  AddEncryptedSecretsMutation,
  AddEncryptedSecretsDocument,
  AddEncryptedSecretsMutationVariables,
  LogoutMutation,
  LogoutMutationVariables,
  LogoutDocument
} from '@shared/graphql/ExtensionDevice.codegen'

import {
  ILoginSecret,
  ITOTPSecret,
  LoginCredentialsTypeWithMeta,
  TotpTypeWithMeta
} from '@src/util/useDeviceState'
import { loginCredentialsSchema } from '@src/util/loginCredentialsSchema'
import {
  cryptoKeyToString,
  abToCryptoKey,
  enc,
  dec,
  base64ToBuffer,
  generateEncryptionKey,
  encryptedBuf_to_base64
} from '@util/generateEncryptionKey'
import { toast } from '@src/ExtensionProviders'
import { createTRPCProxyClient } from '@trpc/client'
import { AppRouter } from './chromeRuntimeListener'
import { chromeLink } from 'trpc-chrome/link'
import { getDomainNameAndTldFromUrl } from '@shared/urlUtils'

export const log = debug('au:Device')

const port = chrome.runtime.connect()
export const extensionDeviceTrpc = createTRPCProxyClient<AppRouter>({
  links: [chromeLink({ port })]
})

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
}

const browserInfo = bowser.getParser(navigator.userAgent)
export const isRunningInBgPage = location.href.includes('backgroundPage.html')

const isVault = location.href.includes('vault.html')
const isPopup = location.href.includes('popup.html')

type SecretTypeUnion = ILoginSecret | ITOTPSecret

const isLoginSecret = (secret: SecretTypeUnion): secret is ILoginSecret =>
  'loginCredentials' in secret

const isTotpSecret = (secret: SecretTypeUnion): secret is ITOTPSecret =>
  'totp' in secret

export type AddSecretInput = Array<
  Omit<SecretSerializedType, 'id'> & {
    totp?: TotpTypeWithMeta
    loginCredentials?: LoginCredentialsTypeWithMeta
  }
>

export const getDecryptedSecretProp = (
  secret: SecretTypeUnion,
  prop: 'url' | 'label' | 'iconUrl' | 'username' | 'password' | 'totp'
) => {
  return (
    (secret.kind === EncryptedSecretType.TOTP
      ? secret.totp[prop]
      : secret.loginCredentials[prop]) ?? ''
  )
}

export class DeviceState implements IBackgroundStateSerializable {
  decryptedSecrets: (ILoginSecret | ITOTPSecret)[]
  constructor(parameters: IBackgroundStateSerializable) {
    Object.assign(this, parameters)
    //log('device state created', this)

    browser.storage.onChanged.addListener(this.onStorageChange)
    this.initialize()
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

  async onStorageChange(
    changes: Record<string, browser.Storage.StorageChange>,
    areaName: string
  ) {
    log('storage changed', changes, areaName)

    if (!device.state) {
      // this can happen for example when the backend is down/unreachable when the background pages is started-it fails to initialize. Then when user logs in, state is ok in vault/popup but not in background page
      await device.initialize()
    }
    if (areaName === 'local' && changes.backgroundState && device.state) {
      Object.assign(device.state, changes.backgroundState.newValue)
    }
  }

  async initialize() {
    this.decryptedSecrets = await this.getAllSecretsDecrypted()
  }

  async setMasterEncryptionKey(masterPassword: string) {
    const key = await generateEncryptionKey(
      masterPassword,
      base64ToBuffer(this.encryptionSalt)
    )
    this.masterEncryptionKey = await cryptoKeyToString(key)
    this.save()
  }

  /**
   * @returns string in base64
   */
  async encrypt(stringToEncrypt: string): Promise<string> {
    const cryptoKey = await abToCryptoKey(
      base64ToBuffer(this.masterEncryptionKey)
    )
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const salt = base64ToBuffer(this.encryptionSalt)

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      enc.encode(stringToEncrypt)
    )

    return encryptedBuf_to_base64(encrypted, iv, salt)
  }

  /**
   * @param encrypted in base64
   * @returns pure string
   */
  async decrypt(encrypted: string): Promise<string> {
    const cryptoKey = await abToCryptoKey(
      base64ToBuffer(this.masterEncryptionKey)
    )
    const encryptedDataBuff = base64ToBuffer(encrypted)
    const iv = encryptedDataBuff.slice(16, 16 + 12)
    const data = encryptedDataBuff.slice(16 + 12)

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    )

    return dec.decode(decrypted)
  }

  async save() {
    browser.storage.onChanged.removeListener(this.onStorageChange)
    device.lockedState = null
    this.decryptedSecrets = await this.getAllSecretsDecrypted()
    // log('SAVE DEVICE STATE', this.decryptedSecrets)
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

  async getSecretsDecryptedByHostname(host: string) {
    let secrets = this.decryptedSecrets.filter((secret) => {
      return (
        host === new URL(getDecryptedSecretProp(secret, 'url') ?? '').hostname
      )
    })
    if (secrets.length === 0) {
      secrets = this.decryptedSecrets.filter((secret) =>
        host.endsWith(
          getDomainNameAndTldFromUrl(
            getDecryptedSecretProp(secret, 'url') ?? ''
          )
        )
      )
    }
    return Promise.all(
      secrets.map((secret) => {
        return this.decryptSecret(secret)
      })
    )
  }

  getAllSecretsDecrypted() {
    return Promise.all(
      this.secrets.map((secret) => {
        return this.decryptSecret(secret)
      })
    )
  }

  private async decryptSecret(secret: SecretSerializedType) {
    const decrypted = await this.decrypt(secret.encrypted)

    let secretDecrypted: ILoginSecret | ITOTPSecret
    if (secret.kind === EncryptedSecretType.TOTP) {
      secretDecrypted = {
        ...secret,
        totp: JSON.parse(decrypted)
      } as ITOTPSecret
    } else if (secret.kind === EncryptedSecretType.LOGIN_CREDENTIALS) {
      const parsed: {
        iconUrl: null
        label: string
        password: string
        url: string
        username: string
      } = JSON.parse(decrypted)

      try {
        loginCredentialsSchema.parse(parsed)
        secretDecrypted = {
          loginCredentials: parsed,
          ...secret
        } as ILoginSecret
      } catch (err: unknown) {
        secretDecrypted = {
          ...secret,
          loginCredentials: {
            username: '',
            password: '',
            parseError: err as Error,
            label: parsed.label,
            url: parsed.url
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
  //TODO: type this
  async findExistingSecret(secret) {
    const existingSecretsOnHostname = await this.getSecretsDecryptedByHostname(
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
   * @returns the added secret in base64
   */
  async addSecrets(secrets: AddSecretInput) {
    const encryptedSecrets = await Promise.all(
      secrets.map(async (secret) => {
        const stringToEncrypt =
          secret.kind === EncryptedSecretType.TOTP
            ? JSON.stringify(secret.totp)
            : JSON.stringify(secret.loginCredentials)

        const encrypted = await this.encrypt(stringToEncrypt)

        return {
          encrypted,
          kind: secret.kind
        }
      })
    )

    const { data, errors } = await apolloClient.mutate<
      AddEncryptedSecretsMutation,
      AddEncryptedSecretsMutationVariables
    >({
      mutation: AddEncryptedSecretsDocument,
      variables: {
        secrets: encryptedSecrets
      }
    })

    if (errors) {
      console.error('errors', errors)
      throw new Error('Error adding secret')
    }
    if (!data) {
      throw new Error('failed to save secret')
    }
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
  initCallbacks: (() => void)[] = []

  async startLockInterval(lockTime: number) {
    await extensionDeviceTrpc.setLockInterval.mutate({ time: lockTime })
  }

  async clearLockInterval() {
    await extensionDeviceTrpc.clearLockInterval.mutate()
  }

  onInitDone(callback: () => void) {
    this.initCallbacks.push(callback)
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
    log('storage', storage)
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
      if (this.lockedState) {
        await browser.storage.local.set({
          backgroundState: null,
          lockedState: this.lockedState
        })

        return
      }
      this.name = this.generateDeviceName()
      this.listenForUserLogin()
    }

    if (this.state && (isVault || isPopup)) {
      this.startLockInterval(this.state.lockTime)
    }

    // const fireToken = await generateFireToken()
    const fireToken = 'aaaa'

    this.fireToken = fireToken
    this.initCallbacks.forEach((cb) => cb())
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

  /**
   * @returns strings in base64
   */
  async initLocalDeviceAuthSecret(
    masterEncryptionKey: CryptoKey,
    salt: Uint8Array
  ): Promise<{
    addDeviceSecret: string
    addDeviceSecretEncrypted: string
  }> {
    const authSecret = this.generateBackendSecret()
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    const addDeviceSecretAb = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      masterEncryptionKey,
      enc.encode(authSecret)
    )

    const addDeviceSecretEncrypted = encryptedBuf_to_base64(
      addDeviceSecretAb,
      iv,
      salt
    )

    return {
      addDeviceSecret: authSecret,
      addDeviceSecretEncrypted: addDeviceSecretEncrypted
    }
  }

  async lock() {
    if (!this.state) {
      throw new Error('no state to lock')
    }

    //QUESTION: When I call here this.clearLockInterval() it doesn't work, trpc port get closed
    //this.clearLockInterval()

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
  }

  async clearAndReload() {
    await removeToken()
    await device.clearLocalStorage()

    device.listenForUserLogin()
    browser.runtime.reload()
  }

  async logout() {
    try {
      await apolloClient.mutate<LogoutMutation, LogoutMutationVariables>({
        mutation: LogoutDocument
      })
    } catch (err: any) {
      toast({
        title: `There was an error logging out: ${err.message} \n., you will need to deauthorize the device manually in device management.`,
        status: 'error',
        onCloseComplete: () => {
          this.clearAndReload()
        }
      })
    } finally {
      await this.clearAndReload()
    }
    await this.clearAndReload()
  }

  async serializeSecrets(
    secrets: SecretSerializedType[],
    newPsw: string
  ): Promise<EncryptedSecretPatchInput[]> {
    const state = this.state
    if (!state) {
      throw new Error('device not initialized')
    }
    return Promise.all(
      secrets.map(async (secret) => {
        const { id, encrypted, kind } = secret
        const decr = await state.decrypt(encrypted)
        log('decrypted secret', decr)
        await state.setMasterEncryptionKey(newPsw)
        const enc = await state.encrypt(decr)

        log('encrypted secret', enc, state.masterEncryptionKey)
        return {
          id,
          encrypted: enc,
          kind
        }
      })
    )
  }

  syncSettings(config: SettingsInput) {
    if (this.state) {
      this.state.autofill = config.autofill
      this.state.lockTime = config.vaultLockTimeoutSeconds
      this.state.syncTOTP = config.syncTOTP
      this.state.language = config.language
      this.state.theme = config.theme ?? 'dark'
    }
  }

  async save(deviceState: IBackgroundStateSerializable) {
    this.state = new DeviceState(deviceState)
    this.state.save()
  }
}
log('Extension device started')
export const device = new ExtensionDevice()

device.initialize()
// @ts-expect-error TODO fix types
window.extensionDevice = device
