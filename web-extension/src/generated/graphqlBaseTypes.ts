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
  firstIpAdress: Scalars['String'];
  lastIpAdress: Scalars['String'];
  firebaseToken: Scalars['String'];
  name: Scalars['String'];
  vaultLockTimeoutSeconds?: Maybe<Scalars['Int']>;
  createdAt: Scalars['DateTime'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  userId: Scalars['String'];
  _count?: Maybe<DeviceCount>;
};

export type DeviceCount = {
  __typename?: 'DeviceCount';
  VaultUnlockEvents: Scalars['Int'];
  VaultUnlockEventsApproved: Scalars['Int'];
};

export type EncryptedAuths = {
  __typename?: 'EncryptedAuths';
  id: Scalars['Int'];
  encrypted: Scalars['String'];
  version: Scalars['Int'];
};

export type LoginResponse = {
  __typename?: 'LoginResponse';
  accessToken: Scalars['String'];
  auths?: Maybe<EncryptedAuths>;
};

export type Mutation = {
  __typename?: 'Mutation';
  user: UserMutation;
  /** you need to be authenticated to call this resolver */
  me: Scalars['String'];
  addDevice: Scalars['Boolean'];
  firebaseToken: Scalars['Boolean'];
  saveAuths: Scalars['Boolean'];
  addOTPEvent: Scalars['Boolean'];
  register: LoginResponse;
  revokeRefreshTokensForUser: Scalars['Boolean'];
  login: LoginResponse;
};


export type MutationUserArgs = {
  userId: Scalars['String'];
};


export type MutationAddDeviceArgs = {
  firebaseToken: Scalars['String'];
  userId: Scalars['String'];
  name: Scalars['String'];
};


export type MutationFirebaseTokenArgs = {
  firebaseToken: Scalars['String'];
  userId: Scalars['String'];
};


export type MutationSaveAuthsArgs = {
  payload: Scalars['String'];
  userId: Scalars['String'];
};


export type MutationAddOtpEventArgs = {
  data: OtpEvent;
};


export type MutationRegisterArgs = {
  firebaseToken: Scalars['String'];
  password: Scalars['String'];
  email: Scalars['String'];
};


export type MutationRevokeRefreshTokensForUserArgs = {
  userId: Scalars['String'];
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
  user: User;
  /** you need to be authenticated to call this resolver */
  authenticated: Scalars['Boolean'];
  me?: Maybe<User>;
  myDevices: Array<Device>;
  devicesCount: Scalars['Int'];
  sendAuthMessage: Scalars['Boolean'];
  sendConfirmation: Scalars['Boolean'];
};


export type QueryUserArgs = {
  userId: Scalars['String'];
};


export type QueryMyDevicesArgs = {
  userId: Scalars['String'];
};


export type QueryDevicesCountArgs = {
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

export type User = {
  __typename?: 'User';
  id: Scalars['String'];
  email?: Maybe<Scalars['String']>;
  phone_number: Scalars['String'];
  account_name: Scalars['String'];
  password: Scalars['String'];
  tokenVersion: Scalars['Float'];
  primaryDeviceId: Scalars['Int'];
  login: LoginResponse;
  myDevices: Array<Device>;
  devicesCount: Scalars['Int'];
  authenticated: Scalars['Boolean'];
};


export type UserLoginArgs = {
  password: Scalars['String'];
  email: Scalars['String'];
};

export type UserMutation = {
  __typename?: 'UserMutation';
  id: Scalars['String'];
  email?: Maybe<Scalars['String']>;
  phone_number: Scalars['String'];
  account_name: Scalars['String'];
  password: Scalars['String'];
  tokenVersion: Scalars['Float'];
  primaryDeviceId: Scalars['Int'];
  register: LoginResponse;
  addDevice: Device;
  saveAuths: Scalars['Boolean'];
  updateFireToken: Scalars['Boolean'];
};


export type UserMutationRegisterArgs = {
  firebaseToken: Scalars['String'];
  password: Scalars['String'];
  email: Scalars['String'];
};


export type UserMutationAddDeviceArgs = {
  firebaseToken: Scalars['String'];
  name: Scalars['String'];
};


export type UserMutationSaveAuthsArgs = {
  payload: Scalars['String'];
};


export type UserMutationUpdateFireTokenArgs = {
  firebaseToken: Scalars['String'];
};
