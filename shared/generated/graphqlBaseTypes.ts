export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: string
  /** A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/. */
  EmailAddress: any
  /** A string that cannot be passed as an empty value */
  NonEmptyString: any
  /** Integers that will have a value of 0 or more. */
  NonNegativeInt: number
  /** Integers that will have a value greater than 0. */
  PositiveInt: number
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  UUID: any
}

export type AddNewDeviceInput = {
  addDeviceSecret: Scalars['NonEmptyString']
  addDeviceSecretEncrypted: Scalars['NonEmptyString']
  decryptionChallengeId: Scalars['PositiveInt']
  deviceId: Scalars['UUID']
  deviceName: Scalars['String']
  email: Scalars['EmailAddress']
  firebaseToken: Scalars['String']
}

export type ChangeMasterPasswordInput = {
  addDeviceSecret: Scalars['NonEmptyString']
  addDeviceSecretEncrypted: Scalars['NonEmptyString']
  decryptionChallengeId: Scalars['PositiveInt']
  secrets: Array<EncryptedSecretPatchInput>
}

export type DecryptionChallengeGql = {
  __typename?: 'DecryptionChallengeGQL'
  User: Array<UserGql>
  addDeviceSecretEncrypted: Scalars['String']
  approvedAt?: Maybe<Scalars['DateTime']>
  approvedByRecovery: Scalars['Boolean']
  approvedFromDevice?: Maybe<DeviceGql>
  approvedFromDeviceId?: Maybe<Scalars['String']>
  blockIp?: Maybe<Scalars['Boolean']>
  createdAt: Scalars['DateTime']
  deviceId?: Maybe<Scalars['String']>
  encryptionSalt: Scalars['String']
  id: Scalars['Int']
  masterPasswordVerifiedAt?: Maybe<Scalars['DateTime']>
  rejectedAt?: Maybe<Scalars['DateTime']>
  user: UserGql
  userId: Scalars['String']
}

export type DecryptionChallengeMutation = {
  __typename?: 'DecryptionChallengeMutation'
  User: Array<UserGql>
  addDeviceSecretEncrypted: Scalars['String']
  approve: DecryptionChallengeGql
  approvedAt?: Maybe<Scalars['DateTime']>
  approvedByRecovery: Scalars['Boolean']
  approvedFromDevice?: Maybe<DeviceGql>
  approvedFromDeviceId?: Maybe<Scalars['String']>
  blockIp?: Maybe<Scalars['Boolean']>
  createdAt: Scalars['DateTime']
  deviceId?: Maybe<Scalars['String']>
  encryptionSalt: Scalars['String']
  id: Scalars['Int']
  masterPasswordVerifiedAt?: Maybe<Scalars['DateTime']>
  recoverAccount: DecryptionChallengeGql
  reject: DecryptionChallengeGql
  rejectedAt?: Maybe<Scalars['DateTime']>
  user: UserGql
  userId: Scalars['String']
}

export type DeviceGql = {
  __typename?: 'DeviceGQL'
  DeviceDecryptionChallengesApproved: Array<DecryptionChallengeGql>
  SecretUsageEvents: Array<SecretUsageEventGql>
  User: UserGql
  UserMaster?: Maybe<UserGql>
  createdAt: Scalars['DateTime']
  deauthorizedFromDeviceId?: Maybe<Scalars['String']>
  firebaseToken: Scalars['String']
  firstIpAddress: Scalars['String']
  id: Scalars['ID']
  ipAddressLock: Scalars['Boolean']
  lastIpAddress: Scalars['String']
  lastSyncAt?: Maybe<Scalars['DateTime']>
  logoutAt?: Maybe<Scalars['DateTime']>
  masterPasswordOutdatedAt?: Maybe<Scalars['DateTime']>
  name: Scalars['String']
  registeredWithMasterAt?: Maybe<Scalars['DateTime']>
  syncTOTP: Scalars['Boolean']
  updatedAt?: Maybe<Scalars['DateTime']>
  userId: Scalars['String']
  vaultLockTimeoutSeconds?: Maybe<Scalars['Int']>
}

export type DeviceMutation = {
  __typename?: 'DeviceMutation'
  createdAt: Scalars['DateTime']
  deauthorizedFromDeviceId?: Maybe<Scalars['String']>
  firebaseToken: Scalars['String']
  firstIpAddress: Scalars['String']
  id: Scalars['ID']
  ipAddressLock: Scalars['Boolean']
  lastIpAddress: Scalars['String']
  lastSyncAt?: Maybe<Scalars['DateTime']>
  logoutAt?: Maybe<Scalars['DateTime']>
  markAsSynced: Scalars['DateTime']
  masterPasswordOutdatedAt?: Maybe<Scalars['DateTime']>
  name: Scalars['String']
  registeredWithMasterAt?: Maybe<Scalars['DateTime']>
  reportSecretUsageEvent: SecretUsageEventGqlScalars
  syncTOTP: Scalars['Boolean']
  updatedAt?: Maybe<Scalars['DateTime']>
  userId: Scalars['String']
  vaultLockTimeoutSeconds?: Maybe<Scalars['Int']>
}

export type DeviceMutationReportSecretUsageEventArgs = {
  kind: Scalars['String']
  secretId: Scalars['UUID']
  webInputId: Scalars['PositiveInt']
}

export type DeviceQuery = {
  __typename?: 'DeviceQuery'
  DeviceDecryptionChallengesApproved: Array<DecryptionChallengeGql>
  SecretUsageEvents: Array<SecretUsageEventGql>
  User: UserGql
  UserMaster?: Maybe<UserGql>
  createdAt: Scalars['DateTime']
  deauthorizedFromDeviceId?: Maybe<Scalars['String']>
  encryptedSecretsToSync: Array<EncryptedSecretQuery>
  firebaseToken: Scalars['String']
  firstIpAddress: Scalars['String']
  id: Scalars['ID']
  ipAddressLock: Scalars['Boolean']
  lastGeoLocation: Scalars['String']
  lastIpAddress: Scalars['String']
  lastSyncAt?: Maybe<Scalars['DateTime']>
  logoutAt?: Maybe<Scalars['DateTime']>
  masterPasswordOutdatedAt?: Maybe<Scalars['DateTime']>
  name: Scalars['String']
  registeredWithMasterAt?: Maybe<Scalars['DateTime']>
  syncTOTP: Scalars['Boolean']
  updatedAt?: Maybe<Scalars['DateTime']>
  userId: Scalars['String']
  vaultLockTimeoutSeconds?: Maybe<Scalars['Int']>
}

export type EmailVerificationGqlScalars = {
  __typename?: 'EmailVerificationGQLScalars'
  address: Scalars['ID']
  createdAt: Scalars['DateTime']
  kind: EmailVerificationType
  userId: Scalars['String']
  verifiedAt?: Maybe<Scalars['DateTime']>
}

export enum EmailVerificationType {
  CONTACT = 'CONTACT',
  PRIMARY = 'PRIMARY'
}

export type EncryptedSecretGql = {
  __typename?: 'EncryptedSecretGQL'
  SecretUsageEvent: Array<SecretUsageEventGql>
  androidUri?: Maybe<Scalars['String']>
  createdAt: Scalars['DateTime']
  deletedAt?: Maybe<Scalars['DateTime']>
  encrypted: Scalars['String']
  iconUrl?: Maybe<Scalars['String']>
  id: Scalars['ID']
  iosUri?: Maybe<Scalars['String']>
  kind: EncryptedSecretType
  label: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  url?: Maybe<Scalars['String']>
  user: UserGql
  userId: Scalars['String']
  version: Scalars['Int']
}

export type EncryptedSecretInput = {
  androidUri?: InputMaybe<Scalars['String']>
  encrypted: Scalars['String']
  iconUrl?: InputMaybe<Scalars['String']>
  iosUri?: InputMaybe<Scalars['String']>
  kind: EncryptedSecretType
  label: Scalars['String']
  url: Scalars['String']
}

export type EncryptedSecretMutation = {
  __typename?: 'EncryptedSecretMutation'
  SecretUsageEvent: Array<SecretUsageEventGql>
  androidUri?: Maybe<Scalars['String']>
  createdAt: Scalars['DateTime']
  delete: EncryptedSecretGql
  deletedAt?: Maybe<Scalars['DateTime']>
  encrypted: Scalars['String']
  iconUrl?: Maybe<Scalars['String']>
  id: Scalars['ID']
  iosUri?: Maybe<Scalars['String']>
  kind: EncryptedSecretType
  label: Scalars['String']
  update: EncryptedSecretGql
  updatedAt?: Maybe<Scalars['DateTime']>
  url?: Maybe<Scalars['String']>
  user: UserGql
  userId: Scalars['String']
  version: Scalars['Int']
}

export type EncryptedSecretMutationUpdateArgs = {
  patch: EncryptedSecretInput
}

export type EncryptedSecretPatchInput = {
  androidUri?: InputMaybe<Scalars['String']>
  encrypted: Scalars['String']
  iconUrl?: InputMaybe<Scalars['String']>
  id: Scalars['UUID']
  iosUri?: InputMaybe<Scalars['String']>
  kind: EncryptedSecretType
  label: Scalars['String']
  url: Scalars['String']
}

export type EncryptedSecretQuery = {
  __typename?: 'EncryptedSecretQuery'
  SecretUsageEvent: Array<SecretUsageEventGql>
  androidUri?: Maybe<Scalars['String']>
  createdAt: Scalars['DateTime']
  deletedAt?: Maybe<Scalars['DateTime']>
  encrypted: Scalars['String']
  iconUrl?: Maybe<Scalars['String']>
  id: Scalars['ID']
  iosUri?: Maybe<Scalars['String']>
  kind: EncryptedSecretType
  label: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  url?: Maybe<Scalars['String']>
  user: UserGql
  userId: Scalars['String']
  version: Scalars['Int']
}

export enum EncryptedSecretType {
  LOGIN_CREDENTIALS = 'LOGIN_CREDENTIALS',
  TOTP = 'TOTP'
}

export type LoginResponse = {
  __typename?: 'LoginResponse'
  accessToken: Scalars['String']
  encryptionSalt: Scalars['String']
  user: UserMutation
}

export type Mutation = {
  __typename?: 'Mutation'
  addNewDeviceForUser: LoginResponse
  addWebInputs: Array<WebInputGql>
  currentDevice: DeviceMutation
  /** returns a decryption challenge */
  deviceDecryptionChallenge?: Maybe<DecryptionChallengeMutation>
  /** removes current device */
  logout?: Maybe<Scalars['Boolean']>
  /** you need to be authenticated to call this resolver */
  me: UserMutation
  registerNewUser: LoginResponse
  user?: Maybe<UserMutation>
}

export type MutationAddNewDeviceForUserArgs = {
  currentAddDeviceSecret: Scalars['NonEmptyString']
  input: AddNewDeviceInput
}

export type MutationAddWebInputsArgs = {
  webInputs: Array<WebInputElement>
}

export type MutationDeviceDecryptionChallengeArgs = {
  deviceId: Scalars['UUID']
  email: Scalars['EmailAddress']
}

export type MutationRegisterNewUserArgs = {
  input: RegisterNewAccountInput
  userId: Scalars['UUID']
}

export type MutationUserArgs = {
  userId: Scalars['String']
}

export type Query = {
  __typename?: 'Query'
  /** you need to be authenticated to call this resolver */
  authenticated: Scalars['Boolean']
  currentDevice: DeviceQuery
  me?: Maybe<UserQuery>
  user?: Maybe<UserQuery>
  webInputs: Array<WebInputGql>
}

export type QueryUserArgs = {
  userId: Scalars['String']
}

export type QueryWebInputsArgs = {
  host: Scalars['String']
}

export type RegisterNewAccountInput = {
  addDeviceSecret: Scalars['NonEmptyString']
  addDeviceSecretEncrypted: Scalars['NonEmptyString']
  deviceId: Scalars['UUID']
  deviceName: Scalars['String']
  email: Scalars['EmailAddress']
  encryptionSalt: Scalars['NonEmptyString']
  firebaseToken: Scalars['String']
}

export type SecretUsageEventGql = {
  __typename?: 'SecretUsageEventGQL'
  Device: DeviceGql
  Secret: EncryptedSecretGql
  User: UserGql
  WebOTPInput?: Maybe<WebInputGql>
  deviceId: Scalars['String']
  id: Scalars['ID']
  kind: Scalars['String']
  secretId: Scalars['String']
  timestamp: Scalars['DateTime']
  url?: Maybe<Scalars['String']>
  userId: Scalars['String']
  webInputId?: Maybe<Scalars['Int']>
}

export type SecretUsageEventGqlScalars = {
  __typename?: 'SecretUsageEventGQLScalars'
  deviceId: Scalars['String']
  id: Scalars['ID']
  kind: Scalars['String']
  secretId: Scalars['String']
  timestamp: Scalars['DateTime']
  url?: Maybe<Scalars['String']>
  userId: Scalars['String']
  webInputId?: Maybe<Scalars['Int']>
}

export type SettingsConfigGql = {
  __typename?: 'SettingsConfigGQL'
  homeUI: Scalars['String']
  lockTime: Scalars['Int']
  noHandsLogin: Scalars['Boolean']
  twoFA: Scalars['Boolean']
  updatedAt?: Maybe<Scalars['DateTime']>
  user: UserGql
  userId: Scalars['ID']
}

export type TagGql = {
  __typename?: 'TagGQL'
  createdAt: Scalars['DateTime']
  id: Scalars['Int']
  name: Scalars['String']
  user: UserGql
  userId: Scalars['String']
}

export type TokenGql = {
  __typename?: 'TokenGQL'
  createdAt: Scalars['DateTime']
  emailToken?: Maybe<Scalars['String']>
  expiration: Scalars['DateTime']
  id: Scalars['Int']
  type: TokenType
  updatedAt?: Maybe<Scalars['DateTime']>
  user: UserGql
  userId: Scalars['String']
  valid: Scalars['Boolean']
}

export enum TokenType {
  API = 'API',
  EMAIL = 'EMAIL'
}

export type UserGql = {
  __typename?: 'UserGQL'
  DecryptionChallenges: Array<DecryptionChallengeGql>
  Devices: Array<DeviceGql>
  EncryptedSecrets: Array<EncryptedSecretGql>
  SettingsConfigs: Array<SettingsConfigGql>
  TOTPlimit: Scalars['Int']
  Tags: Array<TagGql>
  Token: Array<TokenGql>
  UsageEvents: Array<SecretUsageEventGql>
  UserPaidProducts: Array<UserPaidProductsGql>
  WebInputsAdded: Array<WebInputGql>
  addDeviceSecretEncrypted: Scalars['String']
  createdAt: Scalars['DateTime']
  deviceRecoveryCooldownMinutes: Scalars['Int']
  email?: Maybe<Scalars['String']>
  id: Scalars['ID']
  loginCredentialsLimit: Scalars['Int']
  masterDevice?: Maybe<DeviceGql>
  masterDeviceId?: Maybe<Scalars['String']>
  recoveryDecryptionChallenge?: Maybe<DecryptionChallengeGql>
  tokenVersion: Scalars['Int']
  updatedAt?: Maybe<Scalars['DateTime']>
  username?: Maybe<Scalars['String']>
}

export type UserMutation = {
  __typename?: 'UserMutation'
  DecryptionChallenges: Array<DecryptionChallengeGql>
  Devices: Array<DeviceGql>
  EncryptedSecrets: Array<EncryptedSecretGql>
  SettingsConfigs: Array<SettingsConfigGql>
  TOTPlimit: Scalars['Int']
  Tags: Array<TagGql>
  Token: Array<TokenGql>
  UsageEvents: Array<SecretUsageEventGql>
  UserPaidProducts: Array<UserPaidProductsGql>
  WebInputsAdded: Array<WebInputGql>
  addCookie: Scalars['String']
  addDevice: DeviceGql
  addDeviceSecretEncrypted: Scalars['String']
  addEncryptedSecret: EncryptedSecretQuery
  approveDevice: Scalars['Boolean']
  changeMasterPassword: Scalars['PositiveInt']
  createdAt: Scalars['DateTime']
  deviceRecoveryCooldownMinutes: Scalars['Int']
  email?: Maybe<Scalars['EmailAddress']>
  encryptedSecret: EncryptedSecretMutation
  id: Scalars['ID']
  loginCredentialsLimit: Scalars['Int']
  masterDevice?: Maybe<DeviceGql>
  masterDeviceId?: Maybe<Scalars['String']>
  recoveryDecryptionChallenge?: Maybe<DecryptionChallengeGql>
  revokeRefreshTokensForUser: UserGql
  sendEmailVerification: Scalars['NonNegativeInt']
  tokenVersion: Scalars['Int']
  updateFireToken: DeviceGql
  updateSettings: SettingsConfigGql
  updatedAt?: Maybe<Scalars['DateTime']>
  username?: Maybe<Scalars['String']>
}

export type UserMutationAddDeviceArgs = {
  deviceId: Scalars['String']
  firebaseToken: Scalars['String']
  name: Scalars['String']
}

export type UserMutationAddEncryptedSecretArgs = {
  payload: EncryptedSecretInput
}

export type UserMutationApproveDeviceArgs = {
  success: Scalars['Boolean']
}

export type UserMutationChangeMasterPasswordArgs = {
  input: ChangeMasterPasswordInput
}

export type UserMutationEncryptedSecretArgs = {
  id: Scalars['ID']
}

export type UserMutationUpdateFireTokenArgs = {
  firebaseToken: Scalars['String']
}

export type UserMutationUpdateSettingsArgs = {
  homeUI: Scalars['String']
  lockTime: Scalars['Int']
  noHandsLogin: Scalars['Boolean']
  twoFA: Scalars['Boolean']
}

export type UserPaidProductsGql = {
  __typename?: 'UserPaidProductsGQL'
  checkoutSessionId: Scalars['String']
  createdAt: Scalars['DateTime']
  expiresAt?: Maybe<Scalars['DateTime']>
  id: Scalars['Int']
  productId: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  user: UserGql
  userId: Scalars['String']
}

export type UserQuery = {
  __typename?: 'UserQuery'
  DecryptionChallenges: Array<DecryptionChallengeGql>
  Devices: Array<DeviceGql>
  EncryptedSecrets: Array<EncryptedSecretGql>
  SettingsConfigs: Array<SettingsConfigGql>
  TOTPlimit: Scalars['Int']
  Tags: Array<TagGql>
  Token: Array<TokenGql>
  UsageEvents: Array<SecretUsageEventGql>
  UserPaidProducts: Array<UserPaidProductsGql>
  WebInputsAdded: Array<WebInputGql>
  addDeviceSecretEncrypted: Scalars['String']
  createdAt: Scalars['DateTime']
  deviceRecoveryCooldownMinutes: Scalars['Int']
  devices: Array<DeviceQuery>
  devicesCount: Scalars['Int']
  email?: Maybe<Scalars['EmailAddress']>
  emailVerifications: Array<EmailVerificationGqlScalars>
  encryptedSecrets: Array<EncryptedSecretQuery>
  id: Scalars['ID']
  lastChangeInSecrets?: Maybe<Scalars['DateTime']>
  loginCredentialsLimit: Scalars['Int']
  masterDevice?: Maybe<DeviceGql>
  masterDeviceId?: Maybe<Scalars['String']>
  primaryEmailVerification?: Maybe<EmailVerificationGqlScalars>
  recoveryDecryptionChallenge?: Maybe<DecryptionChallengeGql>
  sendAuthMessage: Scalars['Boolean']
  settings: SettingsConfigGql
  tokenVersion: Scalars['Int']
  updatedAt?: Maybe<Scalars['DateTime']>
  username?: Maybe<Scalars['String']>
}

export type UserQueryEncryptedSecretsArgs = {
  fromDate?: InputMaybe<Scalars['DateTime']>
}

export type UserQuerySendAuthMessageArgs = {
  device: Scalars['String']
  location: Scalars['String']
  pageName: Scalars['String']
  time: Scalars['DateTime']
}

export type WebInputElement = {
  domPath: Scalars['String']
  kind: WebInputType
  url: Scalars['String']
}

export type WebInputGql = {
  __typename?: 'WebInputGQL'
  UsageEvents: Array<SecretUsageEventGql>
  addedByUser: UserGql
  addedByUserId: Scalars['String']
  createdAt: Scalars['DateTime']
  domPath: Scalars['String']
  host: Scalars['String']
  id: Scalars['Int']
  kind: WebInputType
  layoutType?: Maybe<Scalars['String']>
  url: Scalars['String']
}

export enum WebInputType {
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
  TOTP = 'TOTP',
  USERNAME = 'USERNAME',
  USERNAME_OR_EMAIL = 'USERNAME_OR_EMAIL'
}
