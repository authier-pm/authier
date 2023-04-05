import { apolloClient } from '../apollo/ApolloClient'
import SInfo from 'react-native-sensitive-info'
import {
  EncryptedSecretGql,
  EncryptedSecretPatchInput,
  EncryptedSecretType,
  SettingsInput
} from '@shared/generated/graphqlBaseTypes'
import { z, ZodError } from 'zod'
import {
  loginCredentialsSchema,
  totpSchema
} from '../../../shared/loginCredentialsSchema'

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
import { enc, encryptedBuf_to_base64 } from '@utils/generateEncryptionKey'
import { Platform } from 'react-native'
import { getSensitiveItem, setSensitiveItem } from './secretStorage'

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
  autofillCredentialsEnabled: boolean
  autofillTOTPEnabled: boolean
  uiLanguage: string
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
  kind: EncryptedSecretType
}
export interface ITOTPSecret extends ISecret {
  totp: z.infer<typeof totpSchema>
  kind: EncryptedSecretType.TOTP
}

export type TotpTypeWithMeta = z.infer<typeof totpSchema>
export type LoginCredentialsTypeWithMeta = z.infer<
  typeof loginCredentialsSchema
> & {
  parseError?: ZodError
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

export const getDecryptedSecretProp = (
  secret: SecretTypeUnion,
  prop: 'url' | 'label' | 'iconUrl'
) => {
  return (
    (secret.kind === EncryptedSecretType.TOTP
      ? secret.totp[prop]
      : secret.loginCredentials[prop]) ?? ''
  )
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
    totp?: TotpTypeWithMeta
    loginCredentials?: LoginCredentialsTypeWithMeta
  }
>

export class Device {
  state: DeviceState | null = null
  fireToken: string | null = null
  lockedState: IBackgroundStateSerializableLocked | null = null
  id: string | null | number[] = null
  platform: 'android' | 'ios' | 'web' | 'windows' | 'macos' | 'linux'
  name!: string
  biometricsAvailable = false
  lockInterval!: NodeJS.Timer | void
  emitter = mitt()

  async save(deviceState?: IBackgroundStateSerializable) {
    //We must clear interval, otherwise we will create a new one every time we save the state
    //because we are creating a new interval every time we we start the app (in syncSettings)
    if (deviceState) {
      this.state = new DeviceState(deviceState)
      this.emitter.emit('stateChange')
    }
    if (!this.state) {
      throw new Error(
        'Device state is not initialized and it was not supplied as an argument'
      )
    }
    await this.state.save()
  }

  /**
   * runs on startup
   */
  async initialize() {
    this.id = await getUniqueId()
    this.platform = Platform.OS
    this.biometricsAvailable = await this.checkBiometrics()

    let storedState: null | IBackgroundStateSerializable = null

    const storedDeviceState = await getSensitiveItem('deviceState')

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
    console.log('token', token)
    this.fireToken = token

    this.emitter.emit('stateChange')
    return this.state
  }

  setDeviceSettings(config: SettingsInput) {
    //HACK: this is a hack, we should not create a new interval every time we save the state
    //NOTE: Document how this works. I am looking on this code and I have no idea what is going on :D
    if (!this.state) {
      console.warn('device not initialized')
      return
    }
    this.state.autofillCredentialsEnabled = config.autofillCredentialsEnabled
    this.state.autofillTOTPEnabled = config.autofillTOTPEnabled
    this.state.lockTime = config.vaultLockTimeoutSeconds
    this.state.syncTOTP = config.syncTOTP

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

  async initLocalDeviceAuthSecret(
    masterEncryptionKey: CryptoKey,
    salt: Uint8Array
  ): Promise<{
    addDeviceSecret: string
    addDeviceSecretEncrypted: string
  }> {
    const authSecret = this.generateBackendSecret()
    const iv = self.crypto.getRandomValues(new Uint8Array(12))

    const addDeviceSecretAb = await self.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      masterEncryptionKey,
      enc.encode(authSecret)
    )

    let addDeviceSecretEncrypted = encryptedBuf_to_base64(
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
      autofillTOTPEnabled,
      autofillCredentialsEnabled,
      uiLanguage,
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
      autofillCredentialsEnabled,
      autofillTOTPEnabled,
      uiLanguage,
      theme,
      biometricsEnabled,
      lockTimeEnd
    }

    await setSensitiveItem('deviceState', {
      backgroundState: null,
      lockedState: this.lockedState
    })

    this.state = null
    this.emitter.emit('stateChange')
  }

  async clearLocalStorage() {
    this.state = null
    await setSensitiveItem('deviceState', {
      backgroundState: null,
      lockedState: null
    })
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
        console.log('decrypted secret', decr)
        await state.setMasterEncryptionKey(newPsw)
        const enc = await state.encrypt(decr)

        console.log('encrypted secret', enc, state.masterEncryptionKey)
        return {
          id,
          encrypted: enc,
          kind
        }
      })
    )
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

    this.save()
  }

  clearLockInterval = () => {
    this.lockInterval = clearInterval(this.lockInterval!)
  }
}

export const device = new Device()

device.initialize()
