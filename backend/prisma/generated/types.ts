import type { ColumnType } from 'kysely'
export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export const TokenType = {
  EMAIL: 'EMAIL',
  API: 'API'
} as const
export type TokenType = (typeof TokenType)[keyof typeof TokenType]
export const EncryptedSecretType = {
  TOTP: 'TOTP',
  LOGIN_CREDENTIALS: 'LOGIN_CREDENTIALS'
} as const
export type EncryptedSecretType =
  (typeof EncryptedSecretType)[keyof typeof EncryptedSecretType]
export const WebInputType = {
  TOTP: 'TOTP',
  USERNAME: 'USERNAME',
  EMAIL: 'EMAIL',
  USERNAME_OR_EMAIL: 'USERNAME_OR_EMAIL',
  PASSWORD: 'PASSWORD',
  NEW_PASSWORD: 'NEW_PASSWORD',
  NEW_PASSWORD_CONFIRMATION: 'NEW_PASSWORD_CONFIRMATION',
  SUBMIT_BUTTON: 'SUBMIT_BUTTON',
  CUSTOM: 'CUSTOM'
} as const
export type WebInputType = (typeof WebInputType)[keyof typeof WebInputType]
export const EmailVerificationType = {
  PRIMARY: 'PRIMARY',
  CONTACT: 'CONTACT'
} as const
export type EmailVerificationType =
  (typeof EmailVerificationType)[keyof typeof EmailVerificationType]
export const UserNewDevicePolicy = {
  ALLOW: 'ALLOW',
  REQUIRE_ANY_DEVICE_APPROVAL: 'REQUIRE_ANY_DEVICE_APPROVAL',
  REQUIRE_MASTER_DEVICE_APPROVAL: 'REQUIRE_MASTER_DEVICE_APPROVAL'
} as const
export type UserNewDevicePolicy =
  (typeof UserNewDevicePolicy)[keyof typeof UserNewDevicePolicy]
export type DecryptionChallenge = {
  id: Generated<number>
  ipAddress: string
  masterPasswordVerifiedAt: Timestamp | null
  approvedAt: Timestamp | null
  rejectedAt: Timestamp | null
  blockIp: boolean | null
  deviceName: string
  deviceId: string
  userId: string
  createdAt: Generated<Timestamp>
  approvedByRecovery: Generated<boolean>
  approvedFromDeviceId: string | null
}
export type DefaultDeviceSettings = {
  id: Generated<number>
  createdAt: Generated<Timestamp>
  updatedAt: Timestamp | null
  autofillCredentialsEnabled: Generated<boolean>
  autofillTOTPEnabled: Generated<boolean>
  theme: Generated<string>
  syncTOTP: Generated<boolean>
  vaultLockTimeoutSeconds: Generated<number>
  userId: string
}
export type Device = {
  id: string
  firstIpAddress: string
  lastIpAddress: string
  firebaseToken: string | null
  name: string
  platform: string
  ipAddressLock: Generated<boolean>
  logoutAt: Timestamp | null
  syncTOTP: boolean
  vaultLockTimeoutSeconds: number
  autofillCredentialsEnabled: boolean
  autofillTOTPEnabled: boolean
  createdAt: Generated<Timestamp>
  updatedAt: Timestamp | null
  deletedAt: Timestamp | null
  registeredWithMasterAt: Timestamp | null
  lastSyncAt: Timestamp | null
  lastUnlockAt: Timestamp | null
  lastLockAt: Timestamp | null
  masterPasswordOutdatedAt: Timestamp | null
  userId: string
}
export type EmailVerification = {
  address: string
  createdAt: Generated<Timestamp>
  verifiedAt: Timestamp | null
  userId: string
  token: string
  kind: EmailVerificationType
}
export type EncryptedSecret = {
  id: string
  encrypted: string
  version: number
  kind: EncryptedSecretType
  createdAt: Generated<Timestamp>
  updatedAt: Timestamp | null
  deletedAt: Timestamp | null
  userId: string
}
export type MasterDeviceChange = {
  id: string
  createdAt: Generated<Timestamp>
  processAt: Timestamp
  oldDeviceId: string
  newDeviceId: string
  userId: string
}
export type SecretUsageEvent = {
  id: Generated<string>
  kind: string
  timestamp: Generated<Timestamp>
  secretId: string
  ipAddress: string
  url: string | null
  userId: string
  deviceId: string
  webInputId: number | null
}
export type Tag = {
  id: Generated<number>
  name: string
  createdAt: Generated<Timestamp>
  userId: string
}
export type Token = {
  id: Generated<number>
  createdAt: Generated<Timestamp>
  updatedAt: Timestamp | null
  type: TokenType
  emailToken: string | null
  valid: Generated<boolean>
  expiration: Timestamp
  userId: string
}
export type User = {
  id: string
  email: string | null
  tokenVersion: Generated<number>
  username: string | null
  addDeviceSecret: string
  addDeviceSecretEncrypted: string
  encryptionSalt: string
  createdAt: Generated<Timestamp>
  updatedAt: Timestamp | null
  masterDeviceId: string | null
  uiLanguage: Generated<string>
  TOTPlimit: number
  loginCredentialsLimit: number
  recoveryDecryptionChallengeId: number | null
  deviceRecoveryCooldownMinutes: number
  notificationOnVaultUnlock: Generated<boolean>
  notificationOnWrongPasswordAttempts: Generated<number>
  newDevicePolicy: UserNewDevicePolicy | null
}
export type UserPaidProducts = {
  id: Generated<number>
  createdAt: Generated<Timestamp>
  updatedAt: Timestamp | null
  expiresAt: Timestamp | null
  productId: string
  userId: string
  checkoutSessionId: string
}
export type WebInput = {
  id: Generated<number>
  layoutType: string | null
  createdAt: Generated<Timestamp>
  host: string
  url: string
  kind: WebInputType
  domPath: string
  domOrdinal: Generated<number>
  addedByUserId: string | null
}
export type DB = {
  DecryptionChallenge: DecryptionChallenge
  DefaultSettings: DefaultDeviceSettings
  Device: Device
  EmailVerification: EmailVerification
  EncryptedSecret: EncryptedSecret
  MasterDeviceChange: MasterDeviceChange
  SecretUsageEvent: SecretUsageEvent
  Tag: Tag
  Token: Token
  User: User
  UserPaidProducts: UserPaidProducts
  WebInput: WebInput
}
