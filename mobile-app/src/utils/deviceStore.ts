import { Platform } from 'react-native'
import { apolloClient } from '../apollo/ApolloClient'
import SInfo from 'react-native-sensitive-info'
import {
  EncryptedSecretGql,
  EncryptedSecretPatchInput,
  EncryptedSecretType
} from '@shared/generated/graphqlBaseTypes'
import { z, ZodError } from 'zod'
import {
  loginCredentialsSchema,
  totpSchema
} from '@shared/loginCredentialsSchema'
import { create } from 'zustand'
import { useDeviceStateStore } from './deviceStateStore'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandStorage } from './storage'
import {
  LogoutDocument,
  LogoutMutation,
  LogoutMutationVariables
} from './deviceStore.codegen'

import { getDeviceName, getUniqueId } from 'react-native-device-info'
import { enc, encryptedBuf_to_base64 } from '@utils/generateEncryptionKey'
import messaging from '@react-native-firebase/messaging'
import {
  SyncSettingsDocument,
  SyncSettingsQuery,
  SyncSettingsQueryVariables
} from '@shared/graphql/Settings.codegen'

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
  vaultLockTimeoutSeconds: number
  syncTOTP: boolean
  autofillCredentialsEnabled: boolean
  autofillTOTPEnabled: boolean
  uiLanguage: string
  theme: string
  biometricsEnabled?: boolean
  lockTimeEnd: number | null
  notificationOnVaultUnlock: boolean
  notificationOnWrongPasswordAttempts: number
  accessToken: string | null
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

interface DeviceProps {
  fireToken: string | null
  lockedState: IBackgroundStateSerializableLocked | null
  id: string | null | number[]
  platform: 'android' | 'ios' | 'web' | 'windows' | 'macos' | 'linux'
  name: string
  biometricsAvailable: boolean
  lockInterval: NodeJS.Timer | void
  isInitialized: boolean
}

interface Device extends DeviceProps {
  save: (deviceState?: IBackgroundStateSerializable) => Promise<void>
  initialize: () => Promise<ReturnType<typeof useDeviceStateStore> | null>
  updateDeviceSettings: () => void
  lock: () => Promise<void>
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
  setLockedState: (newValue: IBackgroundStateSerializableLocked | null) => void
}

const initialState: DeviceProps = {
  fireToken: null,
  lockedState: null,
  id: null,
  platform: Platform.OS,
  name: '',
  biometricsAvailable: false,
  lockInterval: undefined,
  isInitialized: false
}

export const useDeviceStore = create<Device>()(
  persist(
    (set, get) => ({
      ...initialState,
      save: async (deviceState?: IBackgroundStateSerializable) => {
        //We must clear interval, otherwise we will create a new one every time we save the state
        //because we are creating a new interval every time we we start the app (in syncSettings)
        if (deviceState) {
          useDeviceStateStore.setState({ ...deviceState })
        }

        if (!useDeviceStateStore.getState()) {
          throw new Error(
            'Device state is not initialized and it was not supplied as an argument'
          )
        }
      },
      initialize: async () => {
        const start = performance.now()
        const [id, biometricsAvailable, name, token] = await Promise.all([
          getUniqueId(),
          get().checkBiometrics(),
          getDeviceName(),
          messaging().getToken()
          // useDeviceStateStore.getState().initialize()
        ])

        set({
          fireToken: token,
          isInitialized: true,
          platform: Platform.OS,
          name,
          biometricsAvailable,
          id
        })
        const end = performance.now()
        console.log(`Initialize Execution time: ${end - start} ms`)
        return useDeviceStateStore.getState()
      },
      async updateDeviceSettings() {
        try {
          const query = await apolloClient.query<
            SyncSettingsQuery,
            SyncSettingsQueryVariables
          >({
            query: SyncSettingsDocument,
            variables: {},
            fetchPolicy: 'network-only'
          })

          const config = {
            autofillTOTPEnabled: query.data.me.autofillTOTPEnabled,
            autofillCredentialsEnabled:
              query.data.me.autofillCredentialsEnabled,
            syncTOTP: query.data.currentDevice.syncTOTP,
            vaultLockTimeoutSeconds: query.data.currentDevice
              .vaultLockTimeoutSeconds as number,
            uiLanguage: query.data.me.uiLanguage,
            notificationOnVaultUnlock: query.data.me.notificationOnVaultUnlock,
            notificationOnWrongPasswordAttempts:
              query.data.me.notificationOnWrongPasswordAttempts
          }

          //HACK: this is a hack, we should not create a new interval every time we save the state
          let state = useDeviceStateStore.getState()
          if (!state) {
            console.warn('device not initialized')
            return
          }

          useDeviceStateStore.setState({ ...state, ...config })

          // Sync timer

          const device = get()
          if (config.vaultLockTimeoutSeconds > 0) {
            // Sync timer
            if (
              state.vaultLockTimeoutSeconds !== config.vaultLockTimeoutSeconds
            ) {
              console.log(
                'vaultLockTimeoutSeconds',
                config.vaultLockTimeoutSeconds
              )
              useDeviceStateStore.setState({
                lockTimeEnd: Date.now() + config.vaultLockTimeoutSeconds * 1000
              })
            }

            if (state && state.lockTimeEnd && Date.now() >= state.lockTimeEnd) {
              device.lock()
            } else if (state.lockTimeEnd) {
              if (!device.lockInterval) {
                console.log('syncSettings', state.lockTimeEnd)
                device.startVaultLockTimer()
              }
            }
          } else {
            state.lockTimeEnd = null
            device.clearLockInterval()
          }
        } catch (error) {
          console.error(error)
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
        let state = useDeviceStateStore.getState()
        const device = get()
        device.clearLockInterval()
        console.log('state before lock')

        if (!state) {
          console.error('No state')
          return
        }

        const {
          email,
          userId,
          secrets,
          encryptionSalt,
          vaultLockTimeoutSeconds,
          syncTOTP,
          autofillTOTPEnabled,
          autofillCredentialsEnabled,
          uiLanguage,
          theme,
          biometricsEnabled,
          deviceName,
          notificationOnWrongPasswordAttempts,
          notificationOnVaultUnlock,
          accessToken
        } = state
        device.setLockedState({
          email,
          userId,
          secrets,
          deviceName,
          encryptionSalt,
          authSecret: state.authSecret,
          authSecretEncrypted: state.authSecretEncrypted,
          vaultLockTimeoutSeconds,
          syncTOTP,
          autofillCredentialsEnabled,
          autofillTOTPEnabled,
          uiLanguage,
          theme,
          biometricsEnabled,
          lockTimeEnd: null, // when locking the device, we must clear the lockTimeEnd
          notificationOnVaultUnlock,
          notificationOnWrongPasswordAttempts,
          accessToken
        })

        useDeviceStateStore.setState({})
      },
      clearAndReload: async () => {
        useDeviceStateStore.setState({ accessToken: null })
        //TODO: This could be done better
        Promise.all([messaging().deleteToken(), apolloClient.clearStore()])

        get().clearLockInterval()
        SInfo.deleteItem('psw', {
          sharedPreferencesName: 'authierShared',
          keychainService: 'authierKCH'
        })
        useDeviceStateStore.getState().reset()
        const newToken = await messaging().getToken()
        set({ isInitialized: true, fireToken: newToken })
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
        const state = useDeviceStateStore.getState()
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
        let state = useDeviceStateStore.getState()

        return (state.decryptedSecrets.filter(({ kind }) => {
          return kind === EncryptedSecretType.LOGIN_CREDENTIALS
        }) ?? []) as ILoginSecret[]
      },
      TOTPSecrets: () => {
        let state = useDeviceStateStore.getState()
        return (state.decryptedSecrets.filter(({ kind }) => {
          return kind === EncryptedSecretType.TOTP
        }) ?? []) as ITOTPSecret[]
      },
      saveState: async (deviceState: IBackgroundStateSerializable) => {
        useDeviceStateStore.setState({ ...deviceState })
      },
      checkBiometrics: async () => {
        const hasAnySensors = await SInfo.isSensorAvailable()
        //TODO: This is just for android
        //const hasAnyFingerprintsEnrolled = await SInfo.hasEnrolledFingerprints()
        return !!hasAnySensors
      },
      startVaultLockTimer() {
        let state = useDeviceStateStore.getState()
        set({
          lockInterval: setInterval(() => {
            if (state.lockTimeEnd && state.lockTimeEnd <= Date.now()) {
              console.log('Vault locking', state.lockTimeEnd)
              get().lock()
            }
          }, 5000)
        })
      },
      setLockTime: (lockTime: number) => {
        useDeviceStateStore.setState({ vaultLockTimeoutSeconds: lockTime })
        const device = get()
        device.clearLockInterval()
        if (lockTime > 0) {
          useDeviceStateStore.setState({
            lockTimeEnd: Date.now() + lockTime * 1000
          })
          device.startVaultLockTimer()
        }

        // this.save()
      },
      clearLockInterval: () => {
        set({ lockInterval: clearInterval(get().lockInterval!) })
      },
      setLockedState: (lockedState) => {
        set({ lockedState })
      }
    }),
    { name: 'device', storage: createJSONStorage(() => zustandStorage) }
  )
)
