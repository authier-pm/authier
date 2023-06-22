import './chromeRuntimeListener'
import debug from 'debug'
import {
  EncryptedSecretQuery,
  WebInputType
} from '@shared/generated/graphqlBaseTypes'
import { isRunningInBgServiceWorker } from './ExtensionDevice'

export const log = debug('au:backgroundPage')
if (!isRunningInBgServiceWorker) {
  localStorage.debug = 'au:*' // enable all debug messages
}
// log('background page loaded')
export type SecretSerializedType = Pick<
  EncryptedSecretQuery,
  | 'id'
  | 'encrypted'
  | 'kind'
  | 'lastUsedAt'
  | 'createdAt'
  | 'deletedAt'
  | 'updatedAt'
>

export interface IBackgroundStateSerializableLocked {
  email: string
  userId: string
  secrets: Array<SecretSerializedType>
  encryptionSalt: string
  deviceName: string
  authSecretEncrypted: string
  authSecret: string
  vaultLockTimeoutSeconds: number | null
  syncTOTP: boolean | null
  autofillCredentialsEnabled: boolean | null
  autofillTOTPEnabled: boolean | null
  uiLanguage: string | null
  theme: string
  notificationOnVaultUnlock: boolean
  notificationOnWrongPasswordAttempts: number
  firstTimeUser: boolean
}

export interface IBackgroundStateSerializable
  extends IBackgroundStateSerializableLocked {
  masterEncryptionKey: string
}

export interface Coord {
  x: number
  y: number
}
export interface ICapturedInput {
  cssSelector: string
  domOrdinal: number
  type: 'input' | 'submit' | 'keydown'
  kind: WebInputType
  inputted?: string | undefined
}

export interface ILoginCredentialsFromContentScript {
  username: string
  password: string
  capturedInputEvents: ICapturedInput[]
  openInVault: boolean
}
