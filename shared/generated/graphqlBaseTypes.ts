export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: string;
  /** A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/. */
  EmailAddress: any;
  /** A string that cannot be passed as an empty value */
  NonEmptyString: any;
  /** Integers that will have a value of 0 or more. */
  NonNegativeInt: number;
  /** Integers that will have a value greater than 0. */
  PositiveInt: number;
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  UUID: any;
};

export type AddNewDeviceInput = {
  addDeviceSecret: Scalars['NonEmptyString'];
  addDeviceSecretEncrypted: Scalars['NonEmptyString'];
  firebaseToken: Scalars['String'];
};

export type ChangeMasterPasswordInput = {
  addDeviceSecret: Scalars['NonEmptyString'];
  addDeviceSecretEncrypted: Scalars['NonEmptyString'];
  decryptionChallengeId: Scalars['PositiveInt'];
  secrets: Array<EncryptedSecretPatchInput>;
};

export type DecryptionChallenge = DecryptionChallengeApproved | DecryptionChallengeForApproval;

export type DecryptionChallengeApproved = {
  __typename?: 'DecryptionChallengeApproved';
  User: Array<UserGql>;
  addDeviceSecretEncrypted: Scalars['String'];
  addNewDeviceForUser: LoginResponse;
  approvedAt: Scalars['DateTime'];
  approvedByRecovery: Scalars['Boolean'];
  approvedFromDevice?: Maybe<DeviceGql>;
  approvedFromDeviceId?: Maybe<Scalars['String']>;
  blockIp?: Maybe<Scalars['Boolean']>;
  createdAt: Scalars['DateTime'];
  deviceId: Scalars['String'];
  deviceName: Scalars['String'];
  encryptionSalt: Scalars['String'];
  id: Scalars['Int'];
  masterPasswordVerifiedAt?: Maybe<Scalars['DateTime']>;
  rejectedAt?: Maybe<Scalars['DateTime']>;
  user: UserGql;
  userId: Scalars['String'];
};


export type DecryptionChallengeApprovedAddNewDeviceForUserArgs = {
  currentAddDeviceSecret: Scalars['NonEmptyString'];
  input: AddNewDeviceInput;
};

export type DecryptionChallengeForApproval = {
  __typename?: 'DecryptionChallengeForApproval';
  createdAt: Scalars['DateTime'];
  deviceId: Scalars['UUID'];
  deviceName: Scalars['String'];
  id: Scalars['Int'];
  rejectedAt?: Maybe<Scalars['DateTime']>;
};

export type DecryptionChallengeGql = {
  __typename?: 'DecryptionChallengeGQL';
  User: Array<UserGql>;
  approvedAt?: Maybe<Scalars['DateTime']>;
  approvedByRecovery: Scalars['Boolean'];
  approvedFromDevice?: Maybe<DeviceGql>;
  approvedFromDeviceId?: Maybe<Scalars['String']>;
  blockIp?: Maybe<Scalars['Boolean']>;
  createdAt: Scalars['DateTime'];
  deviceId: Scalars['String'];
  deviceName: Scalars['String'];
  id: Scalars['Int'];
  masterPasswordVerifiedAt?: Maybe<Scalars['DateTime']>;
  rejectedAt?: Maybe<Scalars['DateTime']>;
  user: UserGql;
  userId: Scalars['String'];
};

export type DecryptionChallengeMutation = {
  __typename?: 'DecryptionChallengeMutation';
  User: Array<UserGql>;
  approve: DecryptionChallengeGql;
  approvedAt?: Maybe<Scalars['DateTime']>;
  approvedByRecovery: Scalars['Boolean'];
  approvedFromDevice?: Maybe<DeviceGql>;
  approvedFromDeviceId?: Maybe<Scalars['String']>;
  blockIp?: Maybe<Scalars['Boolean']>;
  createdAt: Scalars['DateTime'];
  deviceId: Scalars['String'];
  deviceName: Scalars['String'];
  id: Scalars['Int'];
  masterPasswordVerifiedAt?: Maybe<Scalars['DateTime']>;
  recoverAccount: DecryptionChallengeGql;
  reject: DecryptionChallengeGql;
  rejectedAt?: Maybe<Scalars['DateTime']>;
  user: UserGql;
  userId: Scalars['String'];
};

export type DeviceGql = {
  __typename?: 'DeviceGQL';
  DeviceDecryptionChallengesApproved: Array<DecryptionChallengeGql>;
  SecretUsageEvents: Array<SecretUsageEventGql>;
  User: UserGql;
  UserMaster?: Maybe<UserGql>;
  createdAt: Scalars['DateTime'];
  firebaseToken: Scalars['String'];
  firstIpAddress: Scalars['String'];
  id: Scalars['ID'];
  ipAddressLock: Scalars['Boolean'];
  lastIpAddress: Scalars['String'];
  lastLockAt?: Maybe<Scalars['DateTime']>;
  lastSyncAt?: Maybe<Scalars['DateTime']>;
  lastUnlockAt?: Maybe<Scalars['DateTime']>;
  logoutAt?: Maybe<Scalars['DateTime']>;
  masterPasswordOutdatedAt?: Maybe<Scalars['DateTime']>;
  name: Scalars['String'];
  platform: Scalars['String'];
  registeredWithMasterAt?: Maybe<Scalars['DateTime']>;
  syncTOTP: Scalars['Boolean'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  userId: Scalars['String'];
  vaultLockTimeoutSeconds?: Maybe<Scalars['Int']>;
};

export type DeviceInput = {
  id: Scalars['UUID'];
  name: Scalars['String'];
  platform: Scalars['String'];
};

export type DeviceMutation = {
  __typename?: 'DeviceMutation';
  createdAt: Scalars['DateTime'];
  firebaseToken: Scalars['String'];
  firstIpAddress: Scalars['String'];
  id: Scalars['ID'];
  ipAddressLock: Scalars['Boolean'];
  lastIpAddress: Scalars['String'];
  lastLockAt?: Maybe<Scalars['DateTime']>;
  lastSyncAt?: Maybe<Scalars['DateTime']>;
  lastUnlockAt?: Maybe<Scalars['DateTime']>;
  logout: DeviceGql;
  logoutAt?: Maybe<Scalars['DateTime']>;
  markAsSynced: Scalars['DateTime'];
  masterPasswordOutdatedAt?: Maybe<Scalars['DateTime']>;
  name: Scalars['String'];
  platform: Scalars['String'];
  registeredWithMasterAt?: Maybe<Scalars['DateTime']>;
  /** user has to approve it when they log in again on that device */
  removeDevice: Scalars['Boolean'];
  rename: DeviceGql;
  reportSecretUsageEvent: SecretUsageEventGqlScalars;
  syncTOTP: Scalars['Boolean'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  userId: Scalars['String'];
  vaultLockTimeoutSeconds?: Maybe<Scalars['Int']>;
};


export type DeviceMutationRenameArgs = {
  name: Scalars['String'];
};


export type DeviceMutationReportSecretUsageEventArgs = {
  kind: Scalars['String'];
  secretId: Scalars['UUID'];
  webInputId: Scalars['PositiveInt'];
};

export type DeviceQuery = {
  __typename?: 'DeviceQuery';
  DeviceDecryptionChallengesApproved: Array<DecryptionChallengeGql>;
  SecretUsageEvents: Array<SecretUsageEventGql>;
  User: UserGql;
  UserMaster?: Maybe<UserGql>;
  createdAt: Scalars['DateTime'];
  encryptedSecretsToSync: Array<EncryptedSecretQuery>;
  firebaseToken: Scalars['String'];
  firstIpAddress: Scalars['String'];
  id: Scalars['ID'];
  ipAddressLock: Scalars['Boolean'];
  lastGeoLocation: Scalars['String'];
  lastIpAddress: Scalars['String'];
  lastLockAt?: Maybe<Scalars['DateTime']>;
  lastSyncAt?: Maybe<Scalars['DateTime']>;
  lastUnlockAt?: Maybe<Scalars['DateTime']>;
  logoutAt?: Maybe<Scalars['DateTime']>;
  masterPasswordOutdatedAt?: Maybe<Scalars['DateTime']>;
  name: Scalars['String'];
  platform: Scalars['String'];
  registeredWithMasterAt?: Maybe<Scalars['DateTime']>;
  syncTOTP: Scalars['Boolean'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  userId: Scalars['String'];
  vaultLockTimeoutSeconds?: Maybe<Scalars['Int']>;
};

export type EmailVerificationGqlScalars = {
  __typename?: 'EmailVerificationGQLScalars';
  address: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  kind: EmailVerificationType;
  userId: Scalars['String'];
  verifiedAt?: Maybe<Scalars['DateTime']>;
};

export enum EmailVerificationType {
  CONTACT = 'CONTACT',
  PRIMARY = 'PRIMARY'
}

export type EncryptedSecretGql = {
  __typename?: 'EncryptedSecretGQL';
  SecretUsageEvent: Array<SecretUsageEventGql>;
  createdAt: Scalars['DateTime'];
  deletedAt?: Maybe<Scalars['DateTime']>;
  encrypted: Scalars['String'];
  id: Scalars['ID'];
  kind: EncryptedSecretType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  user: UserGql;
  userId: Scalars['String'];
  version: Scalars['Int'];
};

export type EncryptedSecretInput = {
  encrypted: Scalars['String'];
  kind: EncryptedSecretType;
};

export type EncryptedSecretMutation = {
  __typename?: 'EncryptedSecretMutation';
  SecretUsageEvent: Array<SecretUsageEventGql>;
  createdAt: Scalars['DateTime'];
  delete: EncryptedSecretGql;
  deletedAt?: Maybe<Scalars['DateTime']>;
  encrypted: Scalars['String'];
  id: Scalars['ID'];
  kind: EncryptedSecretType;
  lastUsedAt?: Maybe<Scalars['DateTime']>;
  update: EncryptedSecretGql;
  updatedAt?: Maybe<Scalars['DateTime']>;
  user: UserGql;
  userId: Scalars['String'];
  version: Scalars['Int'];
};


export type EncryptedSecretMutationUpdateArgs = {
  patch: EncryptedSecretInput;
};

export type EncryptedSecretPatchInput = {
  encrypted: Scalars['String'];
  id: Scalars['UUID'];
  kind: EncryptedSecretType;
};

export type EncryptedSecretQuery = {
  __typename?: 'EncryptedSecretQuery';
  SecretUsageEvent: Array<SecretUsageEventGql>;
  createdAt: Scalars['DateTime'];
  deletedAt?: Maybe<Scalars['DateTime']>;
  encrypted: Scalars['String'];
  id: Scalars['ID'];
  kind: EncryptedSecretType;
  lastUsedAt?: Maybe<Scalars['DateTime']>;
  updatedAt?: Maybe<Scalars['DateTime']>;
  user: UserGql;
  userId: Scalars['String'];
  version: Scalars['Int'];
};

export enum EncryptedSecretType {
  LOGIN_CREDENTIALS = 'LOGIN_CREDENTIALS',
  TOTP = 'TOTP'
}

export type LoginResponse = {
  __typename?: 'LoginResponse';
  accessToken: Scalars['String'];
  encryptionSalt: Scalars['String'];
  user: UserMutation;
};

export type MasterDeviceChangeGql = {
  __typename?: 'MasterDeviceChangeGQL';
  createdAt: Scalars['DateTime'];
  id: Scalars['ID'];
  newDeviceId: Scalars['String'];
  oldDeviceId: Scalars['String'];
  processAt: Scalars['DateTime'];
  user: UserGql;
  userId: Scalars['String'];
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
  logout?: Maybe<Scalars['Int']>;
  /** you need to be authenticated to call this resolver */
  me: UserMutation;
  registerNewUser: LoginResponse;
};


export type MutationAddWebInputsArgs = {
  webInputs: Array<WebInputElement>;
};


export type MutationDeviceDecryptionChallengeArgs = {
  deviceInput: DeviceInput;
  email: Scalars['EmailAddress'];
};


export type MutationLogoutArgs = {
  removeDevice?: InputMaybe<Scalars['Boolean']>;
};


export type MutationRegisterNewUserArgs = {
  input: RegisterNewAccountInput;
  userId: Scalars['UUID'];
};

export type Query = {
  __typename?: 'Query';
  /** you need to be authenticated to call this resolver */
  authenticated: Scalars['Boolean'];
  currentDevice: DeviceQuery;
  me: UserQuery;
  osTime: Scalars['String'];
  webInputs: Array<WebInputGql>;
};


export type QueryWebInputsArgs = {
  host: Scalars['String'];
};

export type RegisterNewAccountInput = {
  addDeviceSecret: Scalars['NonEmptyString'];
  addDeviceSecretEncrypted: Scalars['NonEmptyString'];
  deviceId: Scalars['UUID'];
  deviceName: Scalars['String'];
  devicePlatform: Scalars['String'];
  email: Scalars['EmailAddress'];
  encryptionSalt: Scalars['NonEmptyString'];
  firebaseToken: Scalars['String'];
};

export type SecretUsageEventGql = {
  __typename?: 'SecretUsageEventGQL';
  Device: DeviceGql;
  Secret: EncryptedSecretGql;
  User: UserGql;
  WebOTPInput?: Maybe<WebInputGql>;
  deviceId: Scalars['String'];
  id: Scalars['ID'];
  kind: Scalars['String'];
  secretId: Scalars['String'];
  timestamp: Scalars['DateTime'];
  url?: Maybe<Scalars['String']>;
  userId: Scalars['String'];
  webInputId?: Maybe<Scalars['Int']>;
};

export type SecretUsageEventGqlScalars = {
  __typename?: 'SecretUsageEventGQLScalars';
  deviceId: Scalars['String'];
  id: Scalars['ID'];
  kind: Scalars['String'];
  secretId: Scalars['String'];
  timestamp: Scalars['DateTime'];
  url?: Maybe<Scalars['String']>;
  userId: Scalars['String'];
  webInputId?: Maybe<Scalars['Int']>;
};

export type SecretUsageEventInput = {
  kind: Scalars['String'];
  secretId: Scalars['String'];
  url?: InputMaybe<Scalars['String']>;
};

export type SettingsInput = {
  autofill: Scalars['Boolean'];
  language: Scalars['String'];
  syncTOTP: Scalars['Boolean'];
  theme: Scalars['String'];
  vaultLockTimeoutSeconds: Scalars['Int'];
};

export type TagGql = {
  __typename?: 'TagGQL';
  createdAt: Scalars['DateTime'];
  id: Scalars['Int'];
  name: Scalars['String'];
  user: UserGql;
  userId: Scalars['String'];
};

export type TokenGql = {
  __typename?: 'TokenGQL';
  createdAt: Scalars['DateTime'];
  emailToken?: Maybe<Scalars['String']>;
  expiration: Scalars['DateTime'];
  id: Scalars['Int'];
  type: TokenType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  user: UserGql;
  userId: Scalars['String'];
  valid: Scalars['Boolean'];
};

export enum TokenType {
  API = 'API',
  EMAIL = 'EMAIL'
}

export type UserGql = {
  __typename?: 'UserGQL';
  DecryptionChallenges: Array<DecryptionChallengeGql>;
  Devices: Array<DeviceGql>;
  EncryptedSecrets: Array<EncryptedSecretGql>;
  MasterDeviceChange: Array<MasterDeviceChangeGql>;
  TOTPlimit: Scalars['Int'];
  Tags: Array<TagGql>;
  Token: Array<TokenGql>;
  UsageEvents: Array<SecretUsageEventGql>;
  UserPaidProducts: Array<UserPaidProductsGql>;
  WebInputsAdded: Array<WebInputGql>;
  addDeviceSecretEncrypted: Scalars['String'];
  autofill: Scalars['Boolean'];
  createdAt: Scalars['DateTime'];
  deviceRecoveryCooldownMinutes: Scalars['Int'];
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  language: Scalars['String'];
  loginCredentialsLimit: Scalars['Int'];
  masterDevice?: Maybe<DeviceGql>;
  masterDeviceId?: Maybe<Scalars['String']>;
  recoveryDecryptionChallenge?: Maybe<DecryptionChallengeGql>;
  theme: Scalars['String'];
  tokenVersion: Scalars['Int'];
  uiLocalisation: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  username?: Maybe<Scalars['String']>;
};

export type UserMutation = {
  __typename?: 'UserMutation';
  DecryptionChallenges: Array<DecryptionChallengeGql>;
  Devices: Array<DeviceGql>;
  EncryptedSecrets: Array<EncryptedSecretGql>;
  MasterDeviceChange: Array<MasterDeviceChangeGql>;
  TOTPlimit: Scalars['Int'];
  Tags: Array<TagGql>;
  Token: Array<TokenGql>;
  UsageEvents: Array<SecretUsageEventGql>;
  UserPaidProducts: Array<UserPaidProductsGql>;
  WebInputsAdded: Array<WebInputGql>;
  addCookie: Scalars['String'];
  addDevice: DeviceGql;
  addDeviceSecretEncrypted: Scalars['String'];
  addEncryptedSecrets: Array<EncryptedSecretQuery>;
  autofill: Scalars['Boolean'];
  changeMasterPassword: Scalars['PositiveInt'];
  createCheckoutSession: Scalars['String'];
  createPortalSession: Scalars['String'];
  createSecretUsageEvent: SecretUsageEventGqlScalars;
  createdAt: Scalars['DateTime'];
  decryptionChallenge: DecryptionChallengeMutation;
  device: DeviceMutation;
  deviceRecoveryCooldownMinutes: Scalars['Int'];
  email?: Maybe<Scalars['EmailAddress']>;
  encryptedSecret: EncryptedSecretMutation;
  id: Scalars['ID'];
  language: Scalars['String'];
  loginCredentialsLimit: Scalars['Int'];
  masterDevice?: Maybe<DeviceGql>;
  masterDeviceId?: Maybe<Scalars['String']>;
  recoveryDecryptionChallenge?: Maybe<DecryptionChallengeGql>;
  revokeRefreshTokensForUser: UserGql;
  sendEmailVerification: Scalars['NonNegativeInt'];
  setMasterDevice: MasterDeviceChangeGql;
  theme: Scalars['String'];
  tokenVersion: Scalars['Int'];
  uiLocalisation: Scalars['String'];
  updateFireToken: DeviceGql;
  updateSettings: UserGql;
  updatedAt?: Maybe<Scalars['DateTime']>;
  username?: Maybe<Scalars['String']>;
};


export type UserMutationAddDeviceArgs = {
  device: DeviceInput;
  firebaseToken: Scalars['String'];
};


export type UserMutationAddEncryptedSecretsArgs = {
  secrets: Array<EncryptedSecretInput>;
};


export type UserMutationChangeMasterPasswordArgs = {
  input: ChangeMasterPasswordInput;
};


export type UserMutationCreateCheckoutSessionArgs = {
  product: Scalars['String'];
};


export type UserMutationCreateSecretUsageEventArgs = {
  event: SecretUsageEventInput;
};


export type UserMutationDecryptionChallengeArgs = {
  id: Scalars['Int'];
};


export type UserMutationDeviceArgs = {
  id: Scalars['String'];
};


export type UserMutationEncryptedSecretArgs = {
  id: Scalars['ID'];
};


export type UserMutationSetMasterDeviceArgs = {
  newMasterDeviceId: Scalars['String'];
};


export type UserMutationUpdateFireTokenArgs = {
  firebaseToken: Scalars['String'];
};


export type UserMutationUpdateSettingsArgs = {
  config: SettingsInput;
};

export type UserPaidProductsGql = {
  __typename?: 'UserPaidProductsGQL';
  checkoutSessionId: Scalars['String'];
  createdAt: Scalars['DateTime'];
  expiresAt?: Maybe<Scalars['DateTime']>;
  id: Scalars['Int'];
  productId: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  user: UserGql;
  userId: Scalars['String'];
};

export type UserQuery = {
  __typename?: 'UserQuery';
  DecryptionChallenges: Array<DecryptionChallengeGql>;
  Devices: Array<DeviceGql>;
  EncryptedSecrets: Array<EncryptedSecretGql>;
  MasterDeviceChange: Array<MasterDeviceChangeGql>;
  PasswordLimits: Scalars['PositiveInt'];
  TOTPLimits: Scalars['PositiveInt'];
  TOTPlimit: Scalars['Int'];
  Tags: Array<TagGql>;
  Token: Array<TokenGql>;
  UsageEvents: Array<SecretUsageEventGql>;
  UserPaidProducts: Array<UserPaidProductsGql>;
  WebInputsAdded: Array<WebInputGql>;
  addDeviceSecretEncrypted: Scalars['String'];
  autofill: Scalars['Boolean'];
  createdAt: Scalars['DateTime'];
  decryptionChallengesWaiting: Array<DecryptionChallengeForApproval>;
  device: DeviceQuery;
  deviceRecoveryCooldownMinutes: Scalars['Int'];
  devices: Array<DeviceQuery>;
  devicesCount: Scalars['Int'];
  email?: Maybe<Scalars['EmailAddress']>;
  emailVerifications: Array<EmailVerificationGqlScalars>;
  encryptedSecrets: Array<EncryptedSecretQuery>;
  id: Scalars['ID'];
  language: Scalars['String'];
  lastChangeInSecrets?: Maybe<Scalars['DateTime']>;
  loginCredentialsLimit: Scalars['Int'];
  masterDevice?: Maybe<DeviceGql>;
  masterDeviceId?: Maybe<Scalars['String']>;
  primaryEmailVerification?: Maybe<EmailVerificationGqlScalars>;
  recoveryDecryptionChallenge?: Maybe<DecryptionChallengeGql>;
  sendAuthMessage: Scalars['Boolean'];
  theme: Scalars['String'];
  tokenVersion: Scalars['Int'];
  uiLocalisation: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  username?: Maybe<Scalars['String']>;
};


export type UserQueryDeviceArgs = {
  id: Scalars['UUID'];
};


export type UserQuerySendAuthMessageArgs = {
  device: Scalars['String'];
  location: Scalars['String'];
  pageName: Scalars['String'];
  time: Scalars['DateTime'];
};

export type WebInputElement = {
  domOrdinal: Scalars['Int'];
  domPath: Scalars['String'];
  kind: WebInputType;
  url: Scalars['String'];
};

export type WebInputGql = {
  __typename?: 'WebInputGQL';
  UsageEvents: Array<SecretUsageEventGql>;
  addedByUser: UserGql;
  addedByUserId: Scalars['String'];
  createdAt: Scalars['DateTime'];
  domOrdinal: Scalars['Int'];
  domPath: Scalars['String'];
  host: Scalars['String'];
  id: Scalars['Int'];
  kind: WebInputType;
  layoutType?: Maybe<Scalars['String']>;
  url: Scalars['String'];
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
