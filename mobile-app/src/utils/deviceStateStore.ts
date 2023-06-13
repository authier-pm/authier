import { create } from 'zustand'
import { apolloClient } from '../apollo/ApolloClient'
import {
  abToCryptoKey,
  base64ToBuffer,
  bufferToBase64,
  cryptoKeyToString,
  dec,
  enc,
  generateEncryptionKey
} from '@utils/generateEncryptionKey'
import {
  EncryptedSecretType,
  SettingsInput
} from '@shared/generated/graphqlBaseTypes'
import { loginCredentialsSchema } from '@shared/loginCredentialsSchema'

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
import {
  ILoginSecret,
  ITOTPSecret,
  SecretSerializedType,
  AddSecretInput,
  isLoginSecret,
  isTotpSecret,
  getDecryptedSecretProp
} from './deviceStore'

import { getDomainNameAndTldFromUrl } from '@shared/urlUtils'
import { IToastService } from 'native-base/lib/typescript/components/composites/Toast'
import { constructURL } from './urlUtils'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandStorage } from '@utils/storage'

interface DeviceStateProps {
  email: string
  userId: string
  deviceName: string
  encryptionSalt: string
  masterEncryptionKey: string
  secrets: Array<SecretSerializedType>
  authSecret: string
  authSecretEncrypted: string
  vaultLockTimeoutSeconds: number
  syncTOTP: boolean
  autofillCredentialsEnabled: boolean
  autofillTOTPEnabled: boolean
  uiLanguage: string
  theme: string
  biometricsEnabled: boolean
  lockTimeStart: number
  lockTimeEnd: number | null
  lockTimerRunning: boolean
  decryptedSecrets: (ILoginSecret | ITOTPSecret)[]
  notifications: number
  notificationOnVaultUnlock: boolean
  notificationOnWrongPasswordAttempts: number
}

export interface DeviceStateActions extends DeviceStateProps {
  initialize: () => Promise<void>
  setMasterEncryptionKey: (masterPassword: string) => Promise<void>
  encrypt: (stringToEncrypt: string) => Promise<string>
  decrypt: (encrypted: string) => Promise<string>
  getAllSecretsDecrypted: () => Promise<(ILoginSecret | ITOTPSecret)[]>
  decryptSecret: (
    secret: SecretSerializedType
  ) => Promise<ILoginSecret | ITOTPSecret>
  getSecretDecryptedById: (
    id: string
  ) => Promise<ILoginSecret | ITOTPSecret> | undefined
  getSecretsDecryptedByHostname: (
    host: string
  ) => Promise<(ILoginSecret | ITOTPSecret)[]>
  backendSync: (toast: IToastService) => Promise<
    | {
        removedSecrets: number
        newAndUpdatedSecrets: number
      }
    | undefined
  >
  findExistingSecret: (secret) => Promise<SecretSerializedType | undefined>
  addSecrets: (secrets: AddSecretInput) => Promise<
    {
      __typename?: 'EncryptedSecretQuery' | undefined
      id: string
      kind: EncryptedSecretType
      encrypted: string
      version: number
      createdAt: string
      updatedAt?: any
    }[]
  >
  removeSecret: (secrets: string) => Promise<void>
  lockState: () => void
  changeUiLanguage: (language: string) => void
  changeTheme: (theme: string) => void
  changeSecrets: (secrets: SecretSerializedType[]) => void
  changeDecryptedSecrets: (secrets: (ILoginSecret | ITOTPSecret)[]) => void
  changeBiometricsEnabled: (enabled: boolean) => void
  changeSyncTOTP: (syncTOTP: DeviceStateProps['syncTOTP']) => void
  changeNotificationOnVaultUnlock: (value: boolean) => void
  changeNotificationOnWrongPasswordAttempts: (value: number) => void
  reset: () => void
  save: () => void
  setNotifications: (newValue: number) => void
}

const initialState: DeviceStateProps = {
  email: '',
  userId: '',
  deviceName: '',
  encryptionSalt: '',
  masterEncryptionKey: '',
  secrets: [],
  authSecret: '',
  authSecretEncrypted: '',
  vaultLockTimeoutSeconds: 0,
  syncTOTP: false,
  autofillCredentialsEnabled: false,
  autofillTOTPEnabled: false,
  uiLanguage: '',
  notificationOnVaultUnlock: false,
  notificationOnWrongPasswordAttempts: 3,
  theme: 'dark',
  biometricsEnabled: false,
  lockTimeStart: 0,
  lockTimeEnd: 0,
  lockTimerRunning: false,
  decryptedSecrets: [],
  notifications: 0
}

export const useDeviceStateStore = create<DeviceStateActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      getAllSecretsDecrypted: async () => {
        return Promise.all(
          get().secrets.map((secret) => {
            return get().decryptSecret(secret)
          })
        )
      },
      save: async () => {
        let all = await get().getAllSecretsDecrypted()
        set({ decryptedSecrets: all })
      },
      initialize: async () => {
        const start = performance.now()
        set({ decryptedSecrets: await get().getAllSecretsDecrypted() })
        const end = performance.now()
        console.log(`getAllSecretsDecrypted Execution time: ${end - start} ms`)
      },
      setMasterEncryptionKey: async (masterPassword: string) => {
        const key = await generateEncryptionKey(
          masterPassword,
          base64ToBuffer(get().encryptionSalt)
        )
        set({ masterEncryptionKey: await cryptoKeyToString(key) })
        get().save()
      },
      encrypt: async (stringToEncrypt) => {
        const cryptoKey = await abToCryptoKey(
          base64ToBuffer(get().masterEncryptionKey)
        )
        const iv = self.crypto.getRandomValues(new Uint8Array(12))
        const salt = base64ToBuffer(get().encryptionSalt)

        const encrypted = await self.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          enc.encode(stringToEncrypt)
        )

        const encryptedContentArr = new Uint8Array(encrypted)
        const buff = new Uint8Array(
          salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
        )
        buff.set(salt, 0)
        buff.set(iv, salt.byteLength)
        buff.set(encryptedContentArr, salt.byteLength + iv.byteLength)
        const base64Buff = bufferToBase64(buff)

        return base64Buff
      },
      decrypt: async (encrypted) => {
        const cryptoKey = await abToCryptoKey(
          base64ToBuffer(get().masterEncryptionKey)
        )
        const encryptedDataBuff = base64ToBuffer(encrypted)
        const iv = encryptedDataBuff.slice(16, 16 + 12)
        const data = encryptedDataBuff.slice(16 + 12)

        const decrypted = await self.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          data
        )

        return dec.decode(decrypted)
      },
      decryptSecret: async (secret) => {
        const decrypted = await get().decrypt(secret.encrypted)
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
      },
      getSecretDecryptedById: (id: string) => {
        const secret = get().decryptedSecrets.find((secret) => secret.id === id)
        if (secret) {
          return get().decryptSecret(secret)
        }
        return undefined
      },
      getSecretsDecryptedByHostname: async (host: string) => {
        let secrets = get().decryptedSecrets.filter((secret) => {
          return (
            host ===
            constructURL(getDecryptedSecretProp(secret, 'url') ?? '').hostname
          )
        })
        if (secrets.length === 0) {
          secrets = get().decryptedSecrets.filter((secret) =>
            host.endsWith(
              getDomainNameAndTldFromUrl(
                getDecryptedSecretProp(secret, 'url') ?? ''
              )
            )
          )
        }
        return Promise.all(
          secrets.map((secret) => {
            return get().decryptSecret(secret)
          })
        )
      },
      backendSync: async (toast: IToastService) => {
        const { data } = await apolloClient.query<
          SyncEncryptedSecretsQuery,
          SyncEncryptedSecretsQueryVariables
        >({
          query: SyncEncryptedSecretsDocument,
          fetchPolicy: 'network-only'
        })

        if (data) {
          const deviceState = get()
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

            set({ secrets: [...unchangedSecrets, ...newAndUpdatedSecrets] })
            //FIX: We should comapre what changed and decrypt only those
            set({ decryptedSecrets: await get().getAllSecretsDecrypted() })

            await apolloClient.mutate<
              MarkAsSyncedMutation,
              MarkAsSyncedMutationVariables
            >({ mutation: MarkAsSyncedDocument })

            const actuallyRemovedOnThisDevice = backendRemovedSecrets.filter(
              ({ id: removedId }) => {
                return secretsBeforeSync.find(({ id }) => removedId === id)
              }
            )

            const res = {
              removedSecrets: actuallyRemovedOnThisDevice.length,
              newAndUpdatedSecrets: newAndUpdatedSecrets.length
            }

            if (
              (res?.newAndUpdatedSecrets as number) > 0 ||
              (res?.removedSecrets as number) > 0
            ) {
              toast.show({
                title: 'Vault synced',
                description: `Sync successful, added/updated ${res?.newAndUpdatedSecrets}, removed ${res?.removedSecrets}`
              })
            } else {
              toast.show({
                title: 'Vault synced'
              })
            }

            return res
          }
        }
      },
      findExistingSecret: async (secret) => {
        const existingSecretsOnHostname =
          await get().getSecretsDecryptedByHostname(
            constructURL(secret.url).hostname
          )

        return existingSecretsOnHostname.find(
          (s) =>
            (isLoginSecret(s) &&
              s.loginCredentials.username ===
                secret.loginCredentials?.username) ||
            (isTotpSecret(s) && s.totp === secret.totp)
        )
      },
      addSecrets: async (secrets) => {
        const encryptedSecrets = await Promise.all(
          secrets.map(async (secret) => {
            const stringToEncrypt =
              secret.kind === EncryptedSecretType.TOTP
                ? JSON.stringify(secret.totp)
                : JSON.stringify(secret.loginCredentials)

            const encrypted = await get().encrypt(stringToEncrypt)

            return {
              encrypted,
              kind: secret.kind
            }
          })
        )
        console.log('saved secret to the backend', secrets)
        const { data } = await apolloClient.mutate<
          AddEncryptedSecretsMutation,
          AddEncryptedSecretsMutationVariables
        >({
          mutation: AddEncryptedSecretsDocument,
          variables: {
            secrets: encryptedSecrets
          },
          refetchQueries: [{ query: SyncEncryptedSecretsDocument }]
        })
        if (!data) {
          throw new Error('failed to save secret')
        }
        console.log('saved secret to the backend', secrets)
        const secretsAdded = data.me.addEncryptedSecrets

        set({ secrets: [...get().secrets, ...secretsAdded] })
        set({ decryptedSecrets: await get().getAllSecretsDecrypted() })
        return secretsAdded
      },
      removeSecret: async (secretId: string) => {
        set({ secrets: get().secrets.filter((s) => s.id !== secretId) })
        set({ decryptedSecrets: await get().getAllSecretsDecrypted() })
      },
      changeUiLanguage: (language: string) => {
        set({ uiLanguage: language })
      },
      lockState: () =>
        set((state) => {
          const newState = {}
          Object.keys(state).forEach((key) => {
            newState[key] = null
          })
          return newState
        }),
      reset: () => {
        set({
          ...initialState,
          theme: get().theme,
          biometricsEnabled: get().biometricsEnabled,
          syncTOTP: get().syncTOTP,
          uiLanguage: get().uiLanguage
        })
      },
      changeSecrets: (secrets) => {
        set({ secrets })
      },
      changeDecryptedSecrets: (decryptedSecrets) => {
        set({ decryptedSecrets })
      },
      changeTheme: (theme) => {
        set({ theme })
      },
      changeBiometricsEnabled: (biometricsEnabled) => {
        set({ biometricsEnabled })
      },
      changeSyncTOTP: (syncTOTP) => {
        set({ syncTOTP })
      },
      setNotifications: (newValue) => {
        set({ notifications: newValue })
      },
      changeNotificationOnVaultUnlock: (notificationOnVaultUnlock) => {
        set({ notificationOnVaultUnlock })
      },
      changeNotificationOnWrongPasswordAttempts: (value) => {
        set({ notificationOnWrongPasswordAttempts: value })
      }
    }),
    { name: 'deviceState', storage: createJSONStorage(() => zustandStorage) }
  )
)
