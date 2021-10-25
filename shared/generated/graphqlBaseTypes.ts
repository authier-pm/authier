export type Maybe<T> = T | null;
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
};

export type Device = {
  __typename?: 'Device';
  createdAt: Scalars['DateTime'];
  firebaseToken: Scalars['String'];
  firstIpAddress: Scalars['String'];
  id: Scalars['Int'];
  lastIpAddress: Scalars['String'];
  loginSecret: Scalars['String'];
  name: Scalars['String'];
  registeredWithMasterAt?: Maybe<Scalars['DateTime']>;
  syncTOTP: Scalars['Boolean'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  userId: Scalars['String'];
  vaultLockTimeoutSeconds?: Maybe<Scalars['Int']>;
};

export type EncryptedSecrets = {
  __typename?: 'EncryptedSecrets';
  createdAt: Scalars['DateTime'];
  encrypted: Scalars['String'];
  id: Scalars['Int'];
  kind: EncryptedSecretsType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  userId: Scalars['String'];
  version: Scalars['Int'];
};

export enum EncryptedSecretsType {
  LOGIN_CREDENTIALS = 'LOGIN_CREDENTIALS',
  TOTP = 'TOTP'
}

export type LoginResponse = {
  __typename?: 'LoginResponse';
  accessToken: Scalars['String'];
  secrets?: Maybe<Array<EncryptedSecrets>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addDevice: Device;
  addOTPEvent: Scalars['Boolean'];
  addWebInputs: Array<WebInput>;
  login?: Maybe<LoginResponse>;
  logout?: Maybe<Scalars['Boolean']>;
  /** you need to be authenticated to call this resolver */
  me?: Maybe<UserMutation>;
  register: LoginResponse;
  user?: Maybe<UserMutation>;
};


export type MutationAddDeviceArgs = {
  firebaseToken: Scalars['String'];
  name: Scalars['String'];
  userId: Scalars['String'];
};


export type MutationAddOtpEventArgs = {
  data: OtpEvent;
};


export type MutationAddWebInputsArgs = {
  webInputs: Array<WebInputElement>;
};


export type MutationLoginArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};


export type MutationRegisterArgs = {
  email: Scalars['String'];
  firebaseToken: Scalars['String'];
  password: Scalars['String'];
};


export type MutationUserArgs = {
  userId: Scalars['String'];
};

export type OtpEvent = {
  kind: Scalars['String'];
  url: Scalars['String'];
  userId: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  /** you need to be authenticated to call this resolver */
  authenticated: Scalars['Boolean'];
  me?: Maybe<UserQuery>;
  sendAuthMessage: Scalars['Boolean'];
  sendConfirmation: Scalars['Boolean'];
  user?: Maybe<UserQuery>;
  webInputs: Array<WebInput>;
};


export type QuerySendAuthMessageArgs = {
  device: Scalars['String'];
  location: Scalars['String'];
  pageName: Scalars['String'];
  time: Scalars['String'];
  userId: Scalars['String'];
};


export type QuerySendConfirmationArgs = {
  success: Scalars['Boolean'];
  userId: Scalars['String'];
};


export type QueryUserArgs = {
  userId: Scalars['String'];
};


export type QueryWebInputsArgs = {
  url: Scalars['String'];
};

export type SettingsConfig = {
  __typename?: 'SettingsConfig';
  homeUI: Scalars['String'];
  lockTime: Scalars['Int'];
  noHandsLogin: Scalars['Boolean'];
  twoFA: Scalars['Boolean'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  userId: Scalars['String'];
};

export type User = {
  __typename?: 'User';
  TOTPlimit: Scalars['Int'];
  createdAt: Scalars['DateTime'];
  email?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  loginCredentialsLimit: Scalars['Int'];
  masterDeviceId?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  tokenVersion: Scalars['Int'];
  updatedAt?: Maybe<Scalars['DateTime']>;
};

export type UserMutation = {
  __typename?: 'UserMutation';
  TOTPlimit: Scalars['Int'];
  addDevice: Device;
  createdAt: Scalars['DateTime'];
  email?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  loginCredentialsLimit: Scalars['Int'];
  masterDeviceId?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  revokeRefreshTokensForUser: User;
  saveAuths: EncryptedSecrets;
  savePasswords: EncryptedSecrets;
  tokenVersion: Scalars['Int'];
  updateFireToken: Device;
  updateSettings: SettingsConfig;
  updatedAt?: Maybe<Scalars['DateTime']>;
};


export type UserMutationAddDeviceArgs = {
  firebaseToken: Scalars['String'];
  name: Scalars['String'];
};


export type UserMutationSaveAuthsArgs = {
  payload: Scalars['String'];
};


export type UserMutationSavePasswordsArgs = {
  payload: Scalars['String'];
};


export type UserMutationUpdateFireTokenArgs = {
  firebaseToken: Scalars['String'];
};


export type UserMutationUpdateSettingsArgs = {
  homeUI: Scalars['String'];
  lockTime: Scalars['Int'];
  noHandsLogin: Scalars['Boolean'];
  twoFA: Scalars['Boolean'];
};

export type UserQuery = {
  __typename?: 'UserQuery';
  TOTPlimit: Scalars['Int'];
  createdAt: Scalars['DateTime'];
  devicesCount: Scalars['Int'];
  email?: Maybe<Scalars['String']>;
  encryptedSecrets: Array<EncryptedSecrets>;
  id: Scalars['String'];
  loginCredentialsLimit: Scalars['Int'];
  masterDeviceId?: Maybe<Scalars['Int']>;
  myDevices: Array<Device>;
  name?: Maybe<Scalars['String']>;
  settings: SettingsConfig;
  tokenVersion: Scalars['Int'];
  updatedAt?: Maybe<Scalars['DateTime']>;
};

export type WebInput = {
  __typename?: 'WebInput';
  addedByUserId: Scalars['String'];
  createdAt: Scalars['DateTime'];
  domPath: Scalars['String'];
  id: Scalars['Int'];
  kind: WebInputType;
  layoutType?: Maybe<Scalars['String']>;
  url: Scalars['String'];
};

export type WebInputElement = {
  domPath: Scalars['String'];
  kind: WebInputType;
  url: Scalars['String'];
};

export enum WebInputType {
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
  TOTP = 'TOTP',
  USERNAME = 'USERNAME',
  USERNAME_OR_EMAIL = 'USERNAME_OR_EMAIL'
}
