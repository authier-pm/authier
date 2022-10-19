import { apolloClient } from '../apollo/ApolloClient'
import cryptoJS from 'crypto-js'
import SInfo from 'react-native-sensitive-info'
import {
  EncryptedSecretGql,
  EncryptedSecretType,
  SettingsInput
} from '@shared/generated/graphqlBaseTypes'
import { z, ZodError } from 'zod'
import { loginCredentialsSchema } from './loginCredentialsSchema'
import messaging from '@react-native-firebase/messaging'
import {
  LogoutDocument,
  LogoutMutation,
  LogoutMutationVariables
} from '../providers/UserProvider.codegen'
import { clearAccessToken } from './tokenFromAsyncStorage'
import mitt from 'mitt'
import { getDeviceName, getUniqueId } from 'react-native-device-info'
import { DeviceState } from './DeviceState'

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
export const isLoginSecret = (
  secret: SecretTypeUnion
): secret is ILoginSecret => 'loginCredentials' in secret

export const isTotpSecret = (secret: SecretTypeUnion): secret is ITOTPSecret =>
  'totp' in secret

export type AddSecretInput = Array<
  Omit<SecretSerializedType, 'id'> & {
    totp?: string
    loginCredentials?: any
  }
>

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
    const { state } = this
    if (!state) {
      throw new Error('cannot sync without state')
    }
    state.autofill = config.autofill
    state.lockTime = config.vaultLockTimeoutSeconds
    state.syncTOTP = config.syncTOTP
    state.language = config.language
    state.theme = config.theme

    // Sync timer
    if (state.lockTime !== config.vaultLockTimeoutSeconds) {
      state.lockTimeEnd = Date.now() + config.vaultLockTimeoutSeconds * 1000
    }

    if (state.lockTimeEnd <= Date.now()) {
      device.lock()
    } else if (state?.lockTimeEnd) {
      if (!this.lockInterval && state.lockTime > 0) {
        console.log('lockTimeEnd', state?.lockTimeEnd)
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
    this.clearLockInterval()

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
    this.clearLockInterval()
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

  setLockTime(lockTime: number) {
    this.state!.lockTime = lockTime

    this.clearLockInterval()
    if (lockTime > 0) {
      this.state!.lockTimeEnd = Date.now() + this.state!.lockTime * 1000
      this.startVaultLockTimer()
    }

    this.save(false)
  }

  clearLockInterval = () => {
    this.lockInterval = clearInterval(this.lockInterval!)
  }
}

export const device = new Device()

device.initialize()
