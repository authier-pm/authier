export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: { input: any; output: any; }
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: { input: string; output: string; }
  /** A field whose value conforms to the standard internet email address format as specified in HTML Spec: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address. */
  EmailAddress: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  /** A string that cannot be passed as an empty value */
  NonEmptyString: { input: any; output: any; }
  /** Integers that will have a value of 0 or more. */
  NonNegativeInt: { input: number; output: number; }
  /** Integers that will have a value greater than 0. */
  PositiveInt: { input: number; output: number; }
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  UUID: { input: any; output: any; }
};

export type AddNewDeviceInput = {
  addDeviceSecret: Scalars['NonEmptyString']['input'];
  addDeviceSecretEncrypted: Scalars['NonEmptyString']['input'];
  devicePlatform: Scalars['String']['input'];
  encryptionSalt: Scalars['NonEmptyString']['input'];
  firebaseToken: Scalars['String']['input'];
};

export type ChangeMasterPasswordInput = {
  addDeviceSecret: Scalars['NonEmptyString']['input'];
  addDeviceSecretEncrypted: Scalars['NonEmptyString']['input'];
  decryptionChallengeId: Scalars['PositiveInt']['input'];
  secrets: Array<EncryptedSecretPatchInput>;
};

export type DecryptionChallenge = DecryptionChallengeApproved | DecryptionChallengeForApproval;

export type DecryptionChallengeApproved = {
  __typename?: 'DecryptionChallengeApproved';
  User: Array<UserGql>;
  addDeviceSecretEncrypted: Scalars['String']['output'];
  addNewDeviceForUser: LoginResponse;
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedByRecovery: Scalars['Boolean']['output'];
  approvedFromDevice?: Maybe<DeviceGql>;
  approvedFromDeviceId?: Maybe<Scalars['String']['output']>;
  blockIp?: Maybe<Scalars['Boolean']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deviceId: Scalars['String']['output'];
  deviceName: Scalars['String']['output'];
  encryptionSalt: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  ipAddress: Scalars['String']['output'];
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
  user: UserGql;
  userId: Scalars['String']['output'];
};


export type DecryptionChallengeApprovedAddNewDeviceForUserArgs = {
  currentAddDeviceSecret: Scalars['NonEmptyString']['input'];
  input: AddNewDeviceInput;
};

export type DecryptionChallengeForApproval = {
  __typename?: 'DecryptionChallengeForApproval';
  createdAt: Scalars['DateTime']['output'];
  deviceId: Scalars['ID']['output'];
  deviceLocationFromIp?: Maybe<DeviceLocation>;
  deviceName: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  ipAddress: Scalars['String']['output'];
  ipGeoLocation?: Maybe<Scalars['JSON']['output']>;
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type DecryptionChallengeGql = {
  __typename?: 'DecryptionChallengeGQL';
  User: Array<UserGql>;
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedByRecovery: Scalars['Boolean']['output'];
  approvedFromDevice?: Maybe<DeviceGql>;
  approvedFromDeviceId?: Maybe<Scalars['String']['output']>;
  blockIp?: Maybe<Scalars['Boolean']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deviceId: Scalars['String']['output'];
  deviceName: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  ipAddress: Scalars['String']['output'];
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
  user: UserGql;
  userId: Scalars['String']['output'];
};

export type DecryptionChallengeMutation = {
  __typename?: 'DecryptionChallengeMutation';
  User: Array<UserGql>;
  approve: DecryptionChallengeGql;
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedByRecovery: Scalars['Boolean']['output'];
  approvedFromDevice?: Maybe<DeviceGql>;
  approvedFromDeviceId?: Maybe<Scalars['String']['output']>;
  blockIp?: Maybe<Scalars['Boolean']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deviceId: Scalars['String']['output'];
  deviceName: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  ipAddress: Scalars['String']['output'];
  recoverAccount: DecryptionChallengeGql;
  reject: DecryptionChallengeGql;
  rejectedAt?: Maybe<Scalars['DateTime']['output']>;
  user: UserGql;
  userId: Scalars['String']['output'];
};

export type DefaultDeviceSettingsGql = {
  __typename?: 'DefaultDeviceSettingsGQL';
  autofillCredentialsEnabled: Scalars['Boolean']['output'];
  autofillTOTPEnabled: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  syncTOTP: Scalars['Boolean']['output'];
  theme: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user: UserGql;
  userId: Scalars['String']['output'];
  vaultLockTimeoutSeconds: Scalars['Int']['output'];
};

export type DefaultDeviceSettingsGqlScalars = {
  __typename?: 'DefaultDeviceSettingsGQLScalars';
  autofillCredentialsEnabled: Scalars['Boolean']['output'];
  autofillTOTPEnabled: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  syncTOTP: Scalars['Boolean']['output'];
  theme: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId: Scalars['String']['output'];
  vaultLockTimeoutSeconds: Scalars['Int']['output'];
};

export type DefaultDeviceSettingsMutation = {
  __typename?: 'DefaultDeviceSettingsMutation';
  autofillCredentialsEnabled: Scalars['Boolean']['output'];
  autofillTOTPEnabled: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  syncTOTP: Scalars['Boolean']['output'];
  theme: Scalars['String']['output'];
  update: DefaultDeviceSettingsGqlScalars;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId: Scalars['String']['output'];
  vaultLockTimeoutSeconds: Scalars['Int']['output'];
};


export type DefaultDeviceSettingsMutationUpdateArgs = {
  config: DefaultSettingsInput;
};

export type DefaultSettingsInput = {
  autofillCredentialsEnabled: Scalars['Boolean']['input'];
  autofillTOTPEnabled: Scalars['Boolean']['input'];
  syncTOTP: Scalars['Boolean']['input'];
  theme: Scalars['String']['input'];
  uiLanguage: Scalars['String']['input'];
  vaultLockTimeoutSeconds: Scalars['Int']['input'];
};

export type DeviceGql = {
  __typename?: 'DeviceGQL';
  DeviceDecryptionChallengesApproved: Array<DecryptionChallengeGql>;
  SecretUsageEvents: Array<SecretUsageEventGql>;
  User: UserGql;
  UserMaster?: Maybe<UserGql>;
  autofillCredentialsEnabled: Scalars['Boolean']['output'];
  autofillTOTPEnabled: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  firebaseToken?: Maybe<Scalars['String']['output']>;
  firstIpAddress: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ipAddressLock: Scalars['Boolean']['output'];
  lastIpAddress: Scalars['String']['output'];
  lastLockAt?: Maybe<Scalars['DateTime']['output']>;
  lastSyncAt?: Maybe<Scalars['DateTime']['output']>;
  lastUnlockAt?: Maybe<Scalars['DateTime']['output']>;
  logoutAt?: Maybe<Scalars['DateTime']['output']>;
  masterPasswordOutdatedAt?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  platform: Scalars['String']['output'];
  registeredWithMasterAt?: Maybe<Scalars['DateTime']['output']>;
  syncTOTP: Scalars['Boolean']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId: Scalars['String']['output'];
  vaultLockTimeoutSeconds: Scalars['Int']['output'];
};

export type DeviceInput = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  platform: Scalars['String']['input'];
};

export type DeviceLocation = {
  __typename?: 'DeviceLocation';
  city: Scalars['String']['output'];
  countryName: Scalars['String']['output'];
};

export type DeviceMutation = {
  __typename?: 'DeviceMutation';
  autofillCredentialsEnabled: Scalars['Boolean']['output'];
  autofillTOTPEnabled: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  firebaseToken?: Maybe<Scalars['String']['output']>;
  firstIpAddress: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ipAddressLock: Scalars['Boolean']['output'];
  lastIpAddress: Scalars['String']['output'];
  lastLockAt?: Maybe<Scalars['DateTime']['output']>;
  lastSyncAt?: Maybe<Scalars['DateTime']['output']>;
  lastUnlockAt?: Maybe<Scalars['DateTime']['output']>;
  logout: DeviceGql;
  logoutAt?: Maybe<Scalars['DateTime']['output']>;
  markAsSynced: Scalars['DateTime']['output'];
  masterPasswordOutdatedAt?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  platform: Scalars['String']['output'];
  registeredWithMasterAt?: Maybe<Scalars['DateTime']['output']>;
  /** user has to approve it when they log in again on that device */
  removeDevice: Scalars['Boolean']['output'];
  rename: DeviceGql;
  reportSecretUsageEvent: SecretUsageEventGqlScalars;
  syncTOTP: Scalars['Boolean']['output'];
  updateDeviceSettings: DeviceGql;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId: Scalars['String']['output'];
  vaultLockTimeoutSeconds: Scalars['Int']['output'];
};


export type DeviceMutationRenameArgs = {
  name: Scalars['String']['input'];
};


export type DeviceMutationReportSecretUsageEventArgs = {
  kind: Scalars['String']['input'];
  secretId: Scalars['UUID']['input'];
  webInputId: Scalars['PositiveInt']['input'];
};


export type DeviceMutationUpdateDeviceSettingsArgs = {
  syncTOTP: Scalars['Boolean']['input'];
  vaultLockTimeoutSeconds: Scalars['Int']['input'];
};

export type DeviceQuery = {
  __typename?: 'DeviceQuery';
  DeviceDecryptionChallengesApproved: Array<DecryptionChallengeGql>;
  SecretUsageEvents: Array<SecretUsageEventGql>;
  User: UserGql;
  UserMaster?: Maybe<UserGql>;
  autofillCredentialsEnabled: Scalars['Boolean']['output'];
  autofillTOTPEnabled: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Get all secrets that were change since last device sync */
  encryptedSecretsToSync: Array<EncryptedSecretQuery>;
  firebaseToken?: Maybe<Scalars['String']['output']>;
  firstIpAddress: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ipAddressLock: Scalars['Boolean']['output'];
  lastGeoLocation: Scalars['String']['output'];
  lastIpAddress: Scalars['String']['output'];
  lastLockAt?: Maybe<Scalars['DateTime']['output']>;
  lastSyncAt?: Maybe<Scalars['DateTime']['output']>;
  lastUnlockAt?: Maybe<Scalars['DateTime']['output']>;
  logoutAt?: Maybe<Scalars['DateTime']['output']>;
  masterPasswordOutdatedAt?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  platform: Scalars['String']['output'];
  registeredWithMasterAt?: Maybe<Scalars['DateTime']['output']>;
  syncTOTP: Scalars['Boolean']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId: Scalars['String']['output'];
  vaultLockTimeoutSeconds: Scalars['Int']['output'];
};

export type EmailVerificationGqlScalars = {
  __typename?: 'EmailVerificationGQLScalars';
  address: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  kind: EmailVerificationType;
  userId: Scalars['String']['output'];
  verifiedAt?: Maybe<Scalars['DateTime']['output']>;
};

export enum EmailVerificationType {
  CONTACT = 'CONTACT',
  PRIMARY = 'PRIMARY'
}

export type EncryptedSecretGql = {
  __typename?: 'EncryptedSecretGQL';
  SecretUsageEvent: Array<SecretUsageEventGql>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  encrypted: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  kind: EncryptedSecretType;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user: UserGql;
  userId: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};

export type EncryptedSecretInput = {
  encrypted: Scalars['String']['input'];
  kind: EncryptedSecretType;
};

export type EncryptedSecretMutation = {
  __typename?: 'EncryptedSecretMutation';
  SecretUsageEvent: Array<SecretUsageEventGql>;
  createdAt: Scalars['DateTime']['output'];
  delete: EncryptedSecretGql;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  encrypted: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  kind: EncryptedSecretType;
  lastUsedAt?: Maybe<Scalars['DateTime']['output']>;
  update: EncryptedSecretGql;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user: UserGql;
  userId: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};


export type EncryptedSecretMutationUpdateArgs = {
  patch: EncryptedSecretInput;
};

export type EncryptedSecretPatchInput = {
  encrypted: Scalars['String']['input'];
  id: Scalars['UUID']['input'];
  kind: EncryptedSecretType;
};

export type EncryptedSecretQuery = {
  __typename?: 'EncryptedSecretQuery';
  SecretUsageEvent: Array<SecretUsageEventGql>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  encrypted: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  kind: EncryptedSecretType;
  lastUsedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user: UserGql;
  userId: Scalars['String']['output'];
  version: Scalars['Int']['output'];
};

export enum EncryptedSecretType {
  LOGIN_CREDENTIALS = 'LOGIN_CREDENTIALS',
  TOTP = 'TOTP'
}

export type LoginResponse = {
  __typename?: 'LoginResponse';
  accessToken: Scalars['String']['output'];
  encryptionSalt: Scalars['String']['output'];
  user: UserMutation;
};

export type MasterDeviceChangeGql = {
  __typename?: 'MasterDeviceChangeGQL';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  newDeviceId: Scalars['String']['output'];
  oldDeviceId: Scalars['String']['output'];
  processAt: Scalars['DateTime']['output'];
  user: UserGql;
  userId: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addWebInputs: Array<WebInputGql>;
  currentDevice: DeviceMutation;
  /** returns a decryption challenge */
  deviceDecryptionChallenge?: Maybe<DecryptionChallenge>;
  /**
   * removes current device. Returns null if user is not authenticated, alias for device logout/remove methods
   * @deprecated prefer device methods
   */
  logout?: Maybe<Scalars['Int']['output']>;
  /** you need to be authenticated to call this resolver */
  me: UserMutation;
  registerNewUser: LoginResponse;
};


export type MutationAddWebInputsArgs = {
  webInputs: Array<WebInputElement>;
};


export type MutationDeviceDecryptionChallengeArgs = {
  deviceInput: DeviceInput;
  email: Scalars['EmailAddress']['input'];
};


export type MutationLogoutArgs = {
  removeDevice?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationRegisterNewUserArgs = {
  input: RegisterNewAccountInput;
  userId: Scalars['UUID']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** you need to be authenticated to call this resolver */
  authenticated: Scalars['Boolean']['output'];
  currentDevice: DeviceQuery;
  me: UserQuery;
  osTime: Scalars['String']['output'];
  webInputs: Array<WebInputGql>;
};


export type QueryWebInputsArgs = {
  host: Scalars['String']['input'];
};

export type RegisterNewAccountInput = {
  addDeviceSecret: Scalars['NonEmptyString']['input'];
  addDeviceSecretEncrypted: Scalars['NonEmptyString']['input'];
  deviceId: Scalars['ID']['input'];
  deviceName: Scalars['String']['input'];
  devicePlatform: Scalars['String']['input'];
  email: Scalars['EmailAddress']['input'];
  encryptionSalt: Scalars['NonEmptyString']['input'];
  firebaseToken: Scalars['String']['input'];
};

export type SecretUsageEventGql = {
  __typename?: 'SecretUsageEventGQL';
  Device: DeviceGql;
  Secret: EncryptedSecretGql;
  User: UserGql;
  WebOTPInput?: Maybe<WebInputGql>;
  deviceId: Scalars['String']['output'];
  id: Scalars['BigInt']['output'];
  kind: Scalars['String']['output'];
  secretId: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  url?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
  webInputId?: Maybe<Scalars['Int']['output']>;
};

export type SecretUsageEventGqlScalars = {
  __typename?: 'SecretUsageEventGQLScalars';
  deviceId: Scalars['String']['output'];
  id: Scalars['BigInt']['output'];
  kind: Scalars['String']['output'];
  secretId: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  url?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
  webInputId?: Maybe<Scalars['Int']['output']>;
};

export type SecretUsageEventInput = {
  kind: Scalars['String']['input'];
  secretId: Scalars['String']['input'];
  url?: InputMaybe<Scalars['String']['input']>;
};

export type SettingsInput = {
  autofillCredentialsEnabled: Scalars['Boolean']['input'];
  autofillTOTPEnabled: Scalars['Boolean']['input'];
  notificationOnVaultUnlock: Scalars['Boolean']['input'];
  notificationOnWrongPasswordAttempts: Scalars['Int']['input'];
  syncTOTP: Scalars['Boolean']['input'];
  uiLanguage: Scalars['String']['input'];
  vaultLockTimeoutSeconds: Scalars['Int']['input'];
};

export type TagGql = {
  __typename?: 'TagGQL';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  user: UserGql;
  userId: Scalars['String']['output'];
};

export type TokenGql = {
  __typename?: 'TokenGQL';
  createdAt: Scalars['DateTime']['output'];
  emailToken?: Maybe<Scalars['String']['output']>;
  expiration: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  type: TokenType;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user: UserGql;
  userId: Scalars['String']['output'];
  valid: Scalars['Boolean']['output'];
};

export enum TokenType {
  API = 'API',
  EMAIL = 'EMAIL'
}

export type UserGql = {
  __typename?: 'UserGQL';
  DecryptionChallenges: Array<DecryptionChallengeGql>;
  DefaultDeviceSettings?: Maybe<DefaultDeviceSettingsGql>;
  Devices: Array<DeviceGql>;
  EncryptedSecrets: Array<EncryptedSecretGql>;
  MasterDeviceChange: Array<MasterDeviceChangeGql>;
  TOTPlimit: Scalars['Int']['output'];
  Tags: Array<TagGql>;
  Token: Array<TokenGql>;
  UsageEvents: Array<SecretUsageEventGql>;
  UserPaidProducts: Array<UserPaidProductsGql>;
  WebInputsAdded: Array<WebInputGql>;
  addDeviceSecretEncrypted: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deviceRecoveryCooldownMinutes: Scalars['Int']['output'];
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  loginCredentialsLimit: Scalars['Int']['output'];
  masterDevice?: Maybe<DeviceGql>;
  masterDeviceId?: Maybe<Scalars['String']['output']>;
  notificationOnVaultUnlock: Scalars['Boolean']['output'];
  notificationOnWrongPasswordAttempts: Scalars['Int']['output'];
  recoveryDecryptionChallenge?: Maybe<DecryptionChallengeGql>;
  tokenVersion: Scalars['Int']['output'];
  uiLanguage: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type UserMutation = {
  __typename?: 'UserMutation';
  DecryptionChallenges: Array<DecryptionChallengeGql>;
  DefaultDeviceSettings?: Maybe<DefaultDeviceSettingsGql>;
  Devices: Array<DeviceGql>;
  EncryptedSecrets: Array<EncryptedSecretGql>;
  MasterDeviceChange: Array<MasterDeviceChangeGql>;
  TOTPlimit: Scalars['Int']['output'];
  Tags: Array<TagGql>;
  Token: Array<TokenGql>;
  UsageEvents: Array<SecretUsageEventGql>;
  UserPaidProducts: Array<UserPaidProductsGql>;
  WebInputsAdded: Array<WebInputGql>;
  addCookie: Scalars['String']['output'];
  addDevice: DeviceGql;
  addDeviceSecretEncrypted: Scalars['String']['output'];
  addEncryptedSecrets: Array<EncryptedSecretQuery>;
  changeEmail: UserQuery;
  changeMasterPassword: Scalars['Int']['output'];
  createCheckoutSession: Scalars['String']['output'];
  createPortalSession: Scalars['String']['output'];
  createSecretUsageEvent: SecretUsageEventGqlScalars;
  createdAt: Scalars['DateTime']['output'];
  decryptionChallenge: DecryptionChallengeMutation;
  defaultDeviceSettings: DefaultDeviceSettingsMutation;
  delete: UserGql;
  device: DeviceMutation;
  deviceRecoveryCooldownMinutes: Scalars['Int']['output'];
  email?: Maybe<Scalars['EmailAddress']['output']>;
  encryptedSecret: EncryptedSecretMutation;
  id: Scalars['ID']['output'];
  loginCredentialsLimit: Scalars['Int']['output'];
  masterDevice?: Maybe<DeviceGql>;
  masterDeviceId?: Maybe<Scalars['String']['output']>;
  notificationOnVaultUnlock: Scalars['Boolean']['output'];
  notificationOnWrongPasswordAttempts: Scalars['Int']['output'];
  recoveryDecryptionChallenge?: Maybe<DecryptionChallengeGql>;
  removeEncryptedSecrets: Array<EncryptedSecretMutation>;
  revokeRefreshTokensForUser: UserGql;
  sendEmailVerification: Scalars['NonNegativeInt']['output'];
  setMasterDevice: MasterDeviceChangeGql;
  tokenVersion: Scalars['Int']['output'];
  uiLanguage: Scalars['String']['output'];
  updateFireToken: DeviceGql;
  updateSettings: UserGql;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};


export type UserMutationAddDeviceArgs = {
  device: DeviceInput;
  firebaseToken: Scalars['String']['input'];
};


export type UserMutationAddEncryptedSecretsArgs = {
  secrets: Array<EncryptedSecretInput>;
};


export type UserMutationChangeEmailArgs = {
  email: Scalars['EmailAddress']['input'];
};


export type UserMutationChangeMasterPasswordArgs = {
  input: ChangeMasterPasswordInput;
};


export type UserMutationCreateCheckoutSessionArgs = {
  product: Scalars['String']['input'];
};


export type UserMutationCreateSecretUsageEventArgs = {
  event: SecretUsageEventInput;
};


export type UserMutationDecryptionChallengeArgs = {
  id: Scalars['Int']['input'];
};


export type UserMutationDeviceArgs = {
  id: Scalars['String']['input'];
};


export type UserMutationEncryptedSecretArgs = {
  id: Scalars['ID']['input'];
};


export type UserMutationRemoveEncryptedSecretsArgs = {
  secrets: Array<Scalars['UUID']['input']>;
};


export type UserMutationSendEmailVerificationArgs = {
  isMobile?: InputMaybe<Scalars['Boolean']['input']>;
};


export type UserMutationSetMasterDeviceArgs = {
  newMasterDeviceId: Scalars['String']['input'];
};


export type UserMutationUpdateFireTokenArgs = {
  firebaseToken: Scalars['String']['input'];
};


export type UserMutationUpdateSettingsArgs = {
  config: SettingsInput;
};

export type UserPaidProductsGql = {
  __typename?: 'UserPaidProductsGQL';
  checkoutSessionId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['Int']['output'];
  productId: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user: UserGql;
  userId: Scalars['String']['output'];
};

export type UserQuery = {
  __typename?: 'UserQuery';
  DecryptionChallenges: Array<DecryptionChallengeGql>;
  DefaultDeviceSettings?: Maybe<DefaultDeviceSettingsGql>;
  Devices: Array<DeviceGql>;
  EncryptedSecrets: Array<EncryptedSecretGql>;
  MasterDeviceChange: Array<MasterDeviceChangeGql>;
  TOTPlimit: Scalars['Int']['output'];
  Tags: Array<TagGql>;
  Token: Array<TokenGql>;
  UsageEvents: Array<SecretUsageEventGql>;
  UserPaidProducts: Array<UserPaidProductsGql>;
  WebInputsAdded: Array<WebInputGql>;
  addDeviceSecretEncrypted: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  decryptionChallengesWaiting: Array<DecryptionChallengeForApproval>;
  defaultDeviceSettings: DefaultDeviceSettingsGqlScalars;
  device: DeviceQuery;
  deviceRecoveryCooldownMinutes: Scalars['Int']['output'];
  devices: Array<DeviceQuery>;
  devicesCount: Scalars['Int']['output'];
  email?: Maybe<Scalars['EmailAddress']['output']>;
  emailVerifications: Array<EmailVerificationGqlScalars>;
  encryptedSecrets: Array<EncryptedSecretQuery>;
  id: Scalars['ID']['output'];
  lastChangeInSecrets?: Maybe<Scalars['DateTime']['output']>;
  loginCredentialsLimit: Scalars['Int']['output'];
  masterDevice?: Maybe<DeviceGql>;
  masterDeviceId?: Maybe<Scalars['String']['output']>;
  notificationOnVaultUnlock: Scalars['Boolean']['output'];
  notificationOnWrongPasswordAttempts: Scalars['Int']['output'];
  primaryEmailVerification?: Maybe<EmailVerificationGqlScalars>;
  recoveryDecryptionChallenge?: Maybe<DecryptionChallengeGql>;
  /** Sends a message to the master device */
  sendAuthMessage: Scalars['Boolean']['output'];
  tokenVersion: Scalars['Int']['output'];
  uiLanguage: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};


export type UserQueryDeviceArgs = {
  id: Scalars['String']['input'];
};


export type UserQuerySendAuthMessageArgs = {
  body: Scalars['String']['input'];
  deviceId: Scalars['String']['input'];
  title: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type WebInputElement = {
  /** The index of the input element on the page (0-based). We are not able to always generate a css selector which matches only one element. Here the domOrdinal comes in and saves the day. */
  domOrdinal: Scalars['NonNegativeInt']['input'];
  domPath: Scalars['String']['input'];
  kind: WebInputType;
  url: Scalars['String']['input'];
};

export type WebInputGql = {
  __typename?: 'WebInputGQL';
  UsageEvents: Array<SecretUsageEventGql>;
  addedByUser?: Maybe<UserGql>;
  addedByUserId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  domOrdinal: Scalars['Int']['output'];
  domPath: Scalars['String']['output'];
  host: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  kind: WebInputType;
  layoutType?: Maybe<Scalars['String']['output']>;
  url: Scalars['String']['output'];
};

export enum WebInputType {
  CUSTOM = 'CUSTOM',
  EMAIL = 'EMAIL',
  NEW_PASSWORD = 'NEW_PASSWORD',
  NEW_PASSWORD_CONFIRMATION = 'NEW_PASSWORD_CONFIRMATION',
  PASSWORD = 'PASSWORD',
  SUBMIT_BUTTON = 'SUBMIT_BUTTON',
  TOTP = 'TOTP',
  USERNAME = 'USERNAME',
  USERNAME_OR_EMAIL = 'USERNAME_OR_EMAIL'
}
