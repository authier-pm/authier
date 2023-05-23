import { Platform } from 'react-native'

import { apolloClient } from '../apollo/ApolloClient'
import SInfo from 'react-native-sensitive-info'
import {
  EncryptedSecretGql,
  EncryptedSecretPatchInput,
  EncryptedSecretType,
  SettingsInput
} from '@shared/generated/graphqlBaseTypes'
import { boolean, string, z, ZodError } from 'zod'
import {
  loginCredentialsSchema,
  totpSchema
} from '../../../shared/loginCredentialsSchema'

import {
  LogoutDocument,
  LogoutMutation,
  LogoutMutationVariables
} from '../providers/UserProvider.codegen'
import { clearAccessToken } from './tokenFromAsyncStorage'
import mitt from 'mitt'
import { getDeviceName, getUniqueId } from 'react-native-device-info'
import { enc, encryptedBuf_to_base64 } from '@utils/generateEncryptionKey'
import { getSensitiveItem, setSensitiveItem } from './secretStorage'
import messaging from '@react-native-firebase/messaging'

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

import { create, createStore } from 'zustand'
import { useTestStore } from './deviceStateStore'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandStorage } from './mmkvZustandStorage'

interface DeviceProps {
  state: ReturnType<typeof useTestStore> | null
  fireToken: string | null
  lockedState: IBackgroundStateSerializableLocked | null
  id: string | null | number[]
  platform: 'android' | 'ios' | 'web' | 'windows' | 'macos' | 'linux'
  name: string
  biometricsAvailable: boolean
  lockInterval: NodeJS.Timer | void
  isInitialized: boolean
  isLocked: boolean
}

interface Device extends DeviceProps {
  save: (deviceState?: IBackgroundStateSerializable) => Promise<void>
  initialize: () => Promise<ReturnType<typeof useTestStore> | null>
  setDeviceSettings: (config: SettingsInput) => void
  lock: () => Promise<void>
  clearLocalStorage: () => Promise<void>
  clearAndReload: () => Promise<void>
  logout: () => Promise<void>
  serializeSecrets: (
    secrets: SecretSerializedType[],
    newPsw: string
  ) => Promise<EncryptedSecretPatchInput[]>
  saveState: (deviceState: IBackgroundStateSerializable) => Promise<void>
  checkBiometrics: () => Promise<boolean>
  startVaultLockTimer: () => void
  setLockTime: (lockTime: number) => void
  clearLockInterval: () => void
  generateBackendSecret: () => string
  initLocalDeviceAuthSecret: (
    masterEncryptionKey: CryptoKey,
    salt: Uint8Array
  ) => Promise<{
    addDeviceSecret: string
    addDeviceSecretEncrypted: string
  }>
  loginCredentials: () => ILoginSecret[]
  TOTPSecrets: () => ITOTPSecret[]
}

export const useStore = create<Device>()(
  persist(
    (set, get) => ({
      state: null,
      fireToken: null,
      lockedState: null,
      id: null,
      platform: Platform.OS,
      name: '',
      biometricsAvailable: false,
      lockInterval: undefined,
      isInitialized: false,
      isLocked: false,
      save: async (deviceState?: IBackgroundStateSerializable) => {
        //We must clear interval, otherwise we will create a new one every time we save the state
        //because we are creating a new interval every time we we start the app (in syncSettings)
        if (deviceState) {
          set({ state: deviceState })
          // this.emitter.emit('stateChange')
        }
        if (!get().state) {
          throw new Error(
            'Device state is not initialized and it was not supplied as an argument'
          )
        }
        // await this.state.save()
      },
      initialize: async () => {
        set({ id: await getUniqueId() })
        set({ platform: Platform.OS })
        set({ biometricsAvailable: await get().checkBiometrics() })

        //FIX: Not sure how this works
        // let storedState: null | IBackgroundStateSerializable = null
        //
        // const storedDeviceState = await getSensitiveItem('deviceState')
        //
        // let storage: {
        //   backgroundState: IBackgroundStateSerializable
        //   lockedState: null | IBackgroundStateSerializableLocked
        // } | null = null
        //
        // if (storedDeviceState) {
        //   storage = JSON.parse(storedDeviceState)
        // }
        //
        // if (storage?.backgroundState) {
        //   storedState = storage.backgroundState
        //   console.log('device state init from storage')
        // } else if (storage?.lockedState) {
        //   set({ lockedState: storage.lockedState })
        //   console.log('device state locked')
        // }

        // if (storedState) {
        //   this.state = new DeviceState(storedState)
        //   set({name: storedState.deviceName})
        // } else {
        //   set({name: await getDeviceName()})
        //   this.state = null
        // }

        const token = await messaging().getToken()
        set({ fireToken: token })
        set({ isInitialized: true })
        //
        // this.emitter.emit('stateChange')
        console.log('device initialized')
        return useTestStore.getState()
      },
      setDeviceSettings: (config: SettingsInput) => {
        //HACK: this is a hack, we should not create a new interval every time we save the state
        //NOTE: Document how this works. I am looking on this code and I have no idea what is going on :D
        let state = useTestStore.getState()
        if (!state) {
          console.warn('device not initialized')
          return
        }

        useTestStore.setState({ ...state, ...config })

        // Sync timer
        if (state.lockTime !== config.vaultLockTimeoutSeconds) {
          useTestStore.setState({
            lockTimeEnd: Date.now() + config.vaultLockTimeoutSeconds * 1000
          })
        }

        if (Date.now() >= state.lockTimeEnd) {
          get().lock()
        } else if (state.lockTimeEnd) {
          if (!get().lockInterval) {
            console.log('syncSettigs', state.lockTimeEnd)
            get().startVaultLockTimer()
          }
        }
      },
      generateBackendSecret: () => {
        const lengthMultiplier = getRandomInt(1, 10)
        let secret = ''
        for (let i = 0; i < lengthMultiplier; i++) {
          secret += Math.random().toString(36).substring(2, 20)
        }

        return secret
      },
      initLocalDeviceAuthSecret: async (
        masterEncryptionKey: CryptoKey,
        salt: Uint8Array
      ) => {
        const authSecret = get().generateBackendSecret()
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
      },
      lock: async () => {
        let state = useTestStore.getState()
        get().clearLockInterval()

        if (!state) {
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
        } = state

        set({
          lockedState: {
            email,
            userId,
            secrets,
            deviceName: get().name,
            encryptionSalt,
            authSecret: state.authSecret,
            authSecretEncrypted: state.authSecretEncrypted,
            lockTime,
            syncTOTP,
            autofillCredentialsEnabled,
            autofillTOTPEnabled,
            uiLanguage,
            theme,
            biometricsEnabled,
            lockTimeEnd
          }
        })

        //FIX: Not sure what to do
        // await setSensitiveItem('deviceState', {
        //   backgroundState: null,
        //   lockedState: get().lockedState
        // })

        set({ isLocked: true })
        useTestStore.getState().lockState()
      },
      clearLocalStorage: async () => {
        // this.state = null
        await setSensitiveItem('deviceState', {
          backgroundState: null,
          lockedState: null
        })
      },
      clearAndReload: async () => {
        // Your implementation...
        get().clearLockInterval()
        await clearAccessToken()
        // await device.clearLocalStorage()
      },
      logout: async () => {
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
                get().clearAndReload()
              }
            }
          )
        } finally {
          get().clearAndReload()
        }
      },
      serializeSecrets: async (
        secrets: SecretSerializedType[],
        newPsw: string
      ) => {
        const state = useTestStore.getState()
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
      },
      loginCredentials: () => {
        let state = useTestStore.getState()
        return (state.decryptedSecrets.filter(({ kind }) => {
          return kind === EncryptedSecretType.LOGIN_CREDENTIALS
        }) ?? []) as ILoginSecret[]
      },
      TOTPSecrets: () => {
        let state = useTestStore.getState()
        return (state.decryptedSecrets.filter(({ kind }) => {
          return kind === EncryptedSecretType.TOTP
        }) ?? []) as ITOTPSecret[]
      },
      saveState: async (deviceState: IBackgroundStateSerializable) => {
        useTestStore.setState({ ...deviceState })
      },
      checkBiometrics: async () => {
        const hasAnySensors = await SInfo.isSensorAvailable()
        return !!hasAnySensors
      },
      startVaultLockTimer: () => {
        let state = useTestStore.getState()
        set({
          lockInterval: setInterval(() => {
            if (state.lockTimeEnd <= Date.now()) {
              console.log('Vault locked')
              get().lock()
            }
          }, 5000)
        })
      },
      setLockTime: (lockTime: number) => {
        useTestStore.setState({ lockTime })

        get().clearLockInterval()
        if (lockTime > 0) {
          useTestStore.setState({ lockTimeEnd: Date.now() + lockTime * 1000 })
          get().startVaultLockTimer()
        }

        // this.save()
      },
      clearLockInterval: () => {
        set({ lockInterval: clearInterval(get().lockInterval!) })
      }
    }),
    { name: 'device', storage: createJSONStorage(() => zustandStorage) }
  )
)
