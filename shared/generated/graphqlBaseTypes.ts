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
  id: Scalars['Int'];
  firstIpAddress: Scalars['String'];
  lastIpAddress: Scalars['String'];
  firebaseToken: Scalars['String'];
  name: Scalars['String'];
  vaultLockTimeoutSeconds?: Maybe<Scalars['Int']>;
  createdAt: Scalars['DateTime'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  registeredWithMasterAt?: Maybe<Scalars['DateTime']>;
  userId: Scalars['String'];
};

export type EncryptedSecrets = {
  __typename?: 'EncryptedSecrets';
  id: Scalars['Int'];
  encrypted: Scalars['String'];
  version: Scalars['Int'];
  userId: Scalars['String'];
  kind: EncryptedSecretsType;
  createdAt: Scalars['DateTime'];
  updatedAt?: Maybe<Scalars['DateTime']>;
};

export enum EncryptedSecretsType {
  TOTP = 'TOTP',
  LOGIN_CREDENTIALS = 'LOGIN_CREDENTIALS'
}

export type LoginResponse = {
  __typename?: 'LoginResponse';
  accessToken: Scalars['String'];
  secrets?: Maybe<Array<EncryptedSecrets>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  user?: Maybe<UserMutation>;
  /** you need to be authenticated to call this resolver */
  me?: Maybe<UserMutation>;
  addDevice: Device;
  addOTPEvent: Scalars['Boolean'];
  register: LoginResponse;
  login?: Maybe<LoginResponse>;
  logout?: Maybe<Scalars['Boolean']>;
};


export type MutationUserArgs = {
  userId: Scalars['String'];
};


export type MutationAddDeviceArgs = {
  firebaseToken: Scalars['String'];
  userId: Scalars['String'];
  name: Scalars['String'];
};


export type MutationAddOtpEventArgs = {
  data: OtpEvent;
};


export type MutationRegisterArgs = {
  firebaseToken: Scalars['String'];
  password: Scalars['String'];
  email: Scalars['String'];
};


export type MutationLoginArgs = {
  password: Scalars['String'];
  email: Scalars['String'];
};

export type OtpEvent = {
  kind: Scalars['String'];
  url: Scalars['String'];
  userId: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  user?: Maybe<UserQuery>;
  /** you need to be authenticated to call this resolver */
  authenticated: Scalars['Boolean'];
  me?: Maybe<UserQuery>;
  sendAuthMessage: Scalars['Boolean'];
  sendConfirmation: Scalars['Boolean'];
};


export type QueryUserArgs = {
  userId: Scalars['String'];
};


export type QuerySendAuthMessageArgs = {
  pageName: Scalars['String'];
  device: Scalars['String'];
  time: Scalars['String'];
  location: Scalars['String'];
  userId: Scalars['String'];
};


export type QuerySendConfirmationArgs = {
  success: Scalars['Boolean'];
  userId: Scalars['String'];
};

export type SettingsConfig = {
  __typename?: 'SettingsConfig';
  userId: Scalars['String'];
  lockTime: Scalars['Int'];
  twoFA: Scalars['Boolean'];
  noHandsLogin: Scalars['Boolean'];
  homeUI: Scalars['String'];
};

export type User = {
  __typename?: 'User';
  id: Scalars['String'];
  email?: Maybe<Scalars['String']>;
  tokenVersion: Scalars['Int'];
  name?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  masterDeviceId?: Maybe<Scalars['Int']>;
};

export type UserMutation = {
  __typename?: 'UserMutation';
  id: Scalars['String'];
  email?: Maybe<Scalars['String']>;
  tokenVersion: Scalars['Int'];
  name?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  masterDeviceId?: Maybe<Scalars['Int']>;
  addDevice: Device;
  saveAuths: EncryptedSecrets;
  savePasswords: EncryptedSecrets;
  updateFireToken: Device;
  updateSettings: SettingsConfig;
  revokeRefreshTokensForUser: User;
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
  noHandsLogin: Scalars['Boolean'];
  lockTime: Scalars['Int'];
  homeUI: Scalars['String'];
  twoFA: Scalars['Boolean'];
};

export type UserQuery = {
  __typename?: 'UserQuery';
  id: Scalars['String'];
  email?: Maybe<Scalars['String']>;
  tokenVersion: Scalars['Int'];
  name?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  masterDeviceId?: Maybe<Scalars['Int']>;
  myDevices: Array<Device>;
  devicesCount: Scalars['Int'];
  settings: SettingsConfig;
};
