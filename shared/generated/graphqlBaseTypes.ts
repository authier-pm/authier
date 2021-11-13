export type Maybe<T> = T | null
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
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: any
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: string
  /** A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/. */
  EmailAddress: any
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  UUID: any
}

export type Device = {
  __typename?: 'Device'
  createdAt: Scalars['DateTime']
  firebaseToken: Scalars['String']
  firstIpAddress: Scalars['String']
  id: Scalars['String']
  ipAddressLock: Scalars['Boolean']
  lastIpAddress: Scalars['String']
  lastSyncAt?: Maybe<Scalars['DateTime']>
  masterPasswordOutdatedAt?: Maybe<Scalars['DateTime']>
  name: Scalars['String']
  registeredWithMasterAt?: Maybe<Scalars['DateTime']>
  syncTOTP: Scalars['Boolean']
  updatedAt?: Maybe<Scalars['DateTime']>
  userId: Scalars['String']
  vaultLockTimeoutSeconds?: Maybe<Scalars['Int']>
}

export type EncryptedSecret = {
  __typename?: 'EncryptedSecret'
  androidUri?: Maybe<Scalars['String']>
  createdAt: Scalars['DateTime']
  encrypted: Scalars['String']
  iconUrl?: Maybe<Scalars['String']>
  id: Scalars['Int']
  iosUri?: Maybe<Scalars['String']>
  kind: EncryptedSecretType
  label: Scalars['String']
  lastUsageEventId?: Maybe<Scalars['BigInt']>
  updatedAt?: Maybe<Scalars['DateTime']>
  url?: Maybe<Scalars['String']>
  userId: Scalars['String']
  version: Scalars['Int']
}

export type EncryptedSecretInput = {
  androidUri?: Maybe<Scalars['String']>
  encrypted: Scalars['String']
  iosUri?: Maybe<Scalars['String']>
  kind: EncryptedSecretType
  label: Scalars['String']
  url?: Maybe<Scalars['String']>
}

export type EncryptedSecretQuery = {
  __typename?: 'EncryptedSecretQuery'
  androidUri?: Maybe<Scalars['String']>
  createdAt: Scalars['DateTime']
  encrypted: Scalars['String']
  iconUrl?: Maybe<Scalars['String']>
  id: Scalars['Int']
  iosUri?: Maybe<Scalars['String']>
  kind: EncryptedSecretType
  label: Scalars['String']
  lastUsageEventId?: Maybe<Scalars['BigInt']>
  updatedAt?: Maybe<Scalars['DateTime']>
  url?: Maybe<Scalars['String']>
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
  user: UserAfterAuth
}

export type Mutation = {
  __typename?: 'Mutation'
  addNewDeviceForUser: LoginResponse
  addWebInputs: Array<WebInput>
  /** removes current device */
  logout?: Maybe<Scalars['Boolean']>
  /** you need to be authenticated to call this resolver */
  me?: Maybe<UserMutation>
  registerNewUser: LoginResponse
  user?: Maybe<UserMutation>
}

export type MutationAddNewDeviceForUserArgs = {
  currentAddDeviceSecret: Scalars['String']
  input: RegisterNewDeviceInput
}

export type MutationAddWebInputsArgs = {
  webInputs: Array<WebInputElement>
}

export type MutationRegisterNewUserArgs = {
  input: RegisterNewDeviceInput
  userId: Scalars['UUID']
}

export type MutationUserArgs = {
  userId: Scalars['String']
}

export type Query = {
  __typename?: 'Query'
  /** you need to be authenticated to call this resolver */
  authenticated: Scalars['Boolean']
  /** returns a decryption challenge */
  deviceDecryptionChallenge: Array<Scalars['String']>
  me?: Maybe<UserQuery>
  user?: Maybe<UserQuery>
  webInputs: Array<WebInput>
}

export type QueryDeviceDecryptionChallengeArgs = {
  email: Scalars['EmailAddress']
}

export type QueryUserArgs = {
  userId: Scalars['String']
}

export type QueryWebInputsArgs = {
  url: Scalars['String']
}

export type RegisterNewDeviceInput = {
  addDeviceSecret: Scalars['String']
  addDeviceSecretEncrypted: Scalars['String']
  deviceId: Scalars['String']
  deviceName: Scalars['String']
  email: Scalars['EmailAddress']
  firebaseToken: Scalars['String']
}

export type SettingsConfig = {
  __typename?: 'SettingsConfig'
  homeUI: Scalars['String']
  lockTime: Scalars['Int']
  noHandsLogin: Scalars['Boolean']
  twoFA: Scalars['Boolean']
  updatedAt?: Maybe<Scalars['DateTime']>
  userId: Scalars['String']
}

export type User = {
  __typename?: 'User'
  TOTPlimit: Scalars['Int']
  addDeviceSecretEncrypted: Scalars['String']
  createdAt: Scalars['DateTime']
  email?: Maybe<Scalars['String']>
  id: Scalars['String']
  loginCredentialsLimit: Scalars['Int']
  masterDeviceId?: Maybe<Scalars['String']>
  tokenVersion: Scalars['Int']
  updatedAt?: Maybe<Scalars['DateTime']>
  username?: Maybe<Scalars['String']>
}

export type UserAfterAuth = {
  __typename?: 'UserAfterAuth'
  EncryptedSecrets?: Maybe<Array<EncryptedSecret>>
  TOTPlimit: Scalars['Int']
  addDeviceSecretEncrypted: Scalars['String']
  createdAt: Scalars['DateTime']
  email?: Maybe<Scalars['String']>
  id: Scalars['String']
  loginCredentialsLimit: Scalars['Int']
  masterDeviceId?: Maybe<Scalars['String']>
  tokenVersion: Scalars['Int']
  updatedAt?: Maybe<Scalars['DateTime']>
  username?: Maybe<Scalars['String']>
}

export type UserMutation = {
  __typename?: 'UserMutation'
  TOTPlimit: Scalars['Int']
  addDevice: Device
  addDeviceSecretEncrypted: Scalars['String']
  addEncryptedSecret: EncryptedSecretQuery
  approveDevice: Scalars['Boolean']
  createdAt: Scalars['DateTime']
  email?: Maybe<Scalars['EmailAddress']>
  id: Scalars['String']
  loginCredentialsLimit: Scalars['Int']
  masterDeviceId?: Maybe<Scalars['String']>
  revokeRefreshTokensForUser: User
  tokenVersion: Scalars['Int']
  updateFireToken: Device
  updateSettings: SettingsConfig
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

export type UserMutationUpdateFireTokenArgs = {
  firebaseToken: Scalars['String']
}

export type UserMutationUpdateSettingsArgs = {
  homeUI: Scalars['String']
  lockTime: Scalars['Int']
  noHandsLogin: Scalars['Boolean']
  twoFA: Scalars['Boolean']
}

export type UserQuery = {
  __typename?: 'UserQuery'
  TOTPlimit: Scalars['Int']
  addDeviceSecretEncrypted: Scalars['String']
  createdAt: Scalars['DateTime']
  devicesCount: Scalars['Int']
  email?: Maybe<Scalars['EmailAddress']>
  encryptedSecrets: Array<EncryptedSecretQuery>
  id: Scalars['String']
  loginCredentialsLimit: Scalars['Int']
  masterDeviceId?: Maybe<Scalars['String']>
  myDevices: Array<Device>
  sendAuthMessage: Scalars['Boolean']
  settings: SettingsConfig
  tokenVersion: Scalars['Int']
  updatedAt?: Maybe<Scalars['DateTime']>
  username?: Maybe<Scalars['String']>
}

export type UserQuerySendAuthMessageArgs = {
  device: Scalars['String']
  location: Scalars['String']
  pageName: Scalars['String']
  time: Scalars['String']
}

export type WebInput = {
  __typename?: 'WebInput'
  addedByUserId: Scalars['String']
  createdAt: Scalars['DateTime']
  domPath: Scalars['String']
  id: Scalars['Int']
  kind: WebInputType
  layoutType?: Maybe<Scalars['String']>
  url: Scalars['String']
}

export type WebInputElement = {
  domPath: Scalars['String']
  kind: WebInputType
  url: Scalars['String']
}

export enum WebInputType {
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
  TOTP = 'TOTP',
  USERNAME = 'USERNAME',
  USERNAME_OR_EMAIL = 'USERNAME_OR_EMAIL'
}
