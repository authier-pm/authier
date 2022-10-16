import { apolloClient } from '../apollo/ApolloClient'
import cryptoJS from 'crypto-js'
import SInfo from 'react-native-sensitive-info'
import { generateEncryptionKey } from '../../shared/generateEncryptionKey'
import {
  EncryptedSecretGql,
  EncryptedSecretType,
  SettingsInput
} from '@shared/generated/graphqlBaseTypes'
import { z, ZodError } from 'zod'
import { loginCredentialsSchema } from './loginCredentialsSchema'
import {
  AddEncryptedSecretsDocument,
  AddEncryptedSecretsMutation,
  AddEncryptedSecretsMutationVariables,
  MarkAsSyncedDocument,
  MarkAsSyncedMutation,
  MarkAsSyncedMutationVariables,
  SyncEncryptedSecretsDocument,
  SyncEncryptedSecretsQuery,
  SyncEncryptedSecretsQueryVariables
} from '@shared/graphql/ExtensionDevice.codegen'
import messaging from '@react-native-firebase/messaging'
import {
  LogoutDocument,
  LogoutMutation,
  LogoutMutationVariables
} from '../providers/UserProvider.codegen'
import { clearAccessToken } from './tokenFromAsyncStorage'
import mitt from 'mitt'
import { getDeviceName, getUniqueId } from 'react-native-device-info'

export type SecretSerializedType = Pick<
  EncryptedSecretGql,
  'id' | 'encrypted' | 'kind' | 'createdAt' | 'deletedAt' | 'updatedAt'
>
export interface IBackgroundStateSerializableLocked {
  email: string
  userId: string
  secrets: Array<SecretSerializedType>
  encryptionSalt: string
  deviceName: string
  authSecretEncrypted: string
  authSecret: string
  lockTime: number
  syncTOTP: boolean
  autofill: boolean
  language: string
  theme: string
  biometricsEnabled?: boolean
  lockTimeEnd: number
}

export interface IBackgroundStateSerializable
  extends IBackgroundStateSerializableLocked {
  masterEncryptionKey: string
}

export interface ISecret {
  id: string
  encrypted: string
  lastUsedAt?: string | null
  createdAt: string
  label: string
  iconUrl: string | undefined | null
  url: string
  kind: EncryptedSecretType
}
export interface ITOTPSecret extends ISecret {
  totp: string
  kind: EncryptedSecretType.TOTP
}

export interface ILoginSecret extends ISecret {
  loginCredentials: z.infer<typeof loginCredentialsSchema> & {
    parseError?: ZodError
  }
  kind: EncryptedSecretType.LOGIN_CREDENTIALS
}

export interface ISecuritySettings {
  vaultLockTime: number
  noHandsLogin: boolean
}

export interface ISecuritySettingsInBg {
  vaultTime: number
  noHandsLogin: boolean
}

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
}
type SecretTypeUnion = ILoginSecret | ITOTPSecret
const isLoginSecret = (secret: SecretTypeUnion): secret is ILoginSecret =>
  'loginCredentials' in secret

const isTotpSecret = (secret: SecretTypeUnion): secret is ITOTPSecret =>
  'totp' in secret

export type AddSecretInput = Array<
  Omit<SecretSerializedType, 'id'> & {
    totp?: string
    loginCredentials?: any
  }
>

// TODO move out of this file
export class DeviceState implements IBackgroundStateSerializable {
  decryptedSecrets: (ILoginSecret | ITOTPSecret)[]
  constructor(parameters: IBackgroundStateSerializable) {
    Object.assign(this, parameters)
    this.decryptedSecrets = this.getAllSecretsDecrypted()
  }
  email: string
  userId: string
  deviceName: string

  encryptionSalt: string
  masterEncryptionKey: string
  secrets: Array<SecretSerializedType>

  authSecret: string
  authSecretEncrypted!: string

  //Settings
  lockTime: number
  syncTOTP: boolean
  autofill: boolean
  language: string
  theme: string
  biometricsEnabled = false

  //Timer
  lockTimeStart: number
  lockTimeEnd: number
  lockTimerRunning = false

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
    device.lockedState = null
    this.decryptedSecrets = this.getAllSecretsDecrypted()

    await SInfo.setItem(
      'deviceState',
      JSON.stringify({ backgroundState: this, lockedState: null }),
      {
        sharedPreferencesName: 'mySharedPrefs',
        keychainService: 'myKeychain'
      }
    )
  }

  getSecretDecryptedById(id: string) {
    const secret = this.decryptedSecrets.find((secret) => secret.id === id)
    if (secret) {
      return this.decryptSecret(secret)
    }
  }

  getSecretsDecryptedByHostname(host: string) {
    const secrets = this.decryptedSecrets.filter(
      (secret) => host === new URL(secret.url ?? '').hostname
    ) as Array<ILoginSecret | ITOTPSecret>
    if (secrets) {
      return secrets.map((secret) => {
        return this.decryptSecret(secret)
      })
    }
    return []
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
   * @param secret
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
              ? secret.totp
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
    console.log('saved secret to the backend', secrets)
    const secretsAdded = data.me.addEncryptedSecrets

    this.secrets.push(...secretsAdded)
    await this.save()
    return secretsAdded
  }

  async removeSecret(secretId: string) {
    this.secrets = this.secrets.filter((s) => s.id !== secretId)
    this.save()
  }
}

export class Device {
  state: DeviceState | null = null
  fireToken: string | null = null
  lockedState: IBackgroundStateSerializableLocked | null = null
  initializePromise!: Promise<unknown>
  id: string | null | number[] = null
  name!: string
  biometricsAvailable = false
  lockInterval!: NodeJS.Timer | void
  emitter = mitt()

  async save(forceUpdate: boolean = true) {
    //We must clear interval, otherwise we will create a new one every time we save the state
    //because we are creating a new interval every time we we start the app (in syncSettings)
    await this.state?.save()
    if (forceUpdate) {
      this.emitter.emit('stateChange')
    }
  }

  /**
   * runs on startup
   */
  async initialize() {
    this.initializePromise = new Promise(async (resolve) => {
      this.id = getUniqueId()
      this.biometricsAvailable = await this.checkBiometrics()

      let storedState: null | IBackgroundStateSerializable = null

      const storedDeviceState = await SInfo.getItem('deviceState', {
        sharedPreferencesName: 'mySharedPrefs',
        keychainService: 'myKeychain'
      })

      let storage: {
        backgroundState: IBackgroundStateSerializable
        lockedState: null | IBackgroundStateSerializableLocked
      } | null = null

      if (storedDeviceState) {
        storage = JSON.parse(storedDeviceState)
      }

      if (storage?.backgroundState) {
        storedState = storage.backgroundState
        console.log('device state init from storage')
      } else if (storage?.lockedState) {
        this.lockedState = storage.lockedState
        console.log('device state locked')
      }

      if (storedState) {
        this.state = new DeviceState(storedState)
        this.name = storedState.deviceName
      } else {
        this.name = await getDeviceName()
        this.state = null
      }

      const token = await messaging().getToken()

      this.fireToken = token
      console.log('deviceId', this.id)
      resolve(this.state)
    })
    return this.initializePromise
  }

  syncSettings(config: SettingsInput) {
    //HACK: this is a hack, we should not create a new interval every time we save the state
    //NOTE: Document how this works. I am looking on this code and I have no idea what is going on :D
    if (!this.state) {
      console.warn('device not initialized')
      return
    }
    this.state.autofill = config.autofill
    this.state.lockTime = config.vaultLockTimeoutSeconds
    this.state.syncTOTP = config.syncTOTP
    this.state.language = config.language
    this.state.theme = config.theme

    // Sync timer
    if (this.state.lockTime !== config.vaultLockTimeoutSeconds) {
      this.state.lockTimeEnd =
        Date.now() + config.vaultLockTimeoutSeconds * 1000
    }

    if (Date.now() >= device.state!.lockTimeEnd) {
      device.lock()
    } else if (device.state?.lockTimeEnd) {
      if (!this.lockInterval) {
        console.log('syncSettigs', device.state?.lockTimeEnd)
        device.startVaultLockTimer()
      }
    }
  }

  generateBackendSecret(): string {
    const lengthMultiplier = getRandomInt(1, 10)
    let secret = ''
    for (let i = 0; i < lengthMultiplier; i++) {
      secret += Math.random().toString(36).substring(2, 20)
    }

    return secret
  }

  initLocalDeviceAuthSecret(
    masterEncryptionKey: string,
    userId: string
  ):
    | {
      addDeviceSecret: string
      addDeviceSecretEncrypted: string
    }
    | undefined {
    try {
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
    } catch (e) {
      //@ts-expect-error
      console.error(e.stack)
      throw e
    }
  }

  async lock() {
    this.clearInterval()

    if (!this.state) {
      return
    }

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
      biometricsEnabled,
      lockTimeEnd
    } = this.state

    this.lockedState = {
      email,
      userId,
      secrets,
      deviceName: this.name,
      encryptionSalt,
      authSecret: this.state.authSecret,
      authSecretEncrypted: this.state.authSecretEncrypted,
      lockTime,
      syncTOTP,
      autofill,
      language,
      theme,
      biometricsEnabled,
      lockTimeEnd
    }

    await SInfo.setItem(
      'deviceState',
      JSON.stringify({ backgroundState: null, lockedState: this.lockedState }),
      {
        sharedPreferencesName: 'mySharedPrefs',
        keychainService: 'myKeychain'
      }
    )

    this.state = null
    this.emitter.emit('stateChange')
  }

  async clearLocalStorage() {
    this.state = null
    await SInfo.setItem(
      'deviceState',
      JSON.stringify({ backgroundState: null, lockedState: null }),
      {
        sharedPreferencesName: 'mySharedPrefs',
        keychainService: 'myKeychain'
      }
    )
  }

  clearAndReload = async () => {
    this.clearInterval()
    await clearAccessToken()
    await device.clearLocalStorage()
    this.emitter.emit('stateChange')
  }

  async logout() {
    try {
      await apolloClient.mutate<LogoutMutation, LogoutMutationVariables>({
        mutation: LogoutDocument
      })
    } catch (err: any) {
      console.error(
        `There was an error logging out: ${err.message} \n., you will need to deauthorize the device manually in device management.`,
        {
          autoClose: false,
          onClose: async () => {
            this.clearAndReload()
          }
        }
      )
    } finally {
      this.clearAndReload()
    }
  }

  get loginCredentials() {
    return (this.state?.decryptedSecrets.filter(({ kind }) => {
      return kind === EncryptedSecretType.LOGIN_CREDENTIALS
    }) ?? []) as ILoginSecret[]
  }

  get TOTPSecrets() {
    return (this.state?.decryptedSecrets.filter(({ kind }) => {
      return kind === EncryptedSecretType.TOTP
    }) ?? []) as ITOTPSecret[]
  }

  async saveState(deviceState: IBackgroundStateSerializable) {
    this.state = new DeviceState(deviceState)
    this.state.save()
  }

  async checkBiometrics(): Promise<boolean> {
    const hasAnySensors = await SInfo.isSensorAvailable()
    return !!hasAnySensors
  }

  startVaultLockTimer = () => {
    this.lockInterval = setInterval(() => {
      console.log(
        'tick',
        (this.state!.lockTimeEnd - Date.now()) / 1000,
        this.state?.lockTimeEnd
      )
      if (this.state!.lockTimeEnd <= Date.now()) {
        console.log('Vault locked')
        device.lock()
      }
    }, 5000)
  }

  clearInterval = () => {
    this.lockInterval = clearInterval(this.lockInterval!)
  }
}

export const device = new Device()

device.initialize()
