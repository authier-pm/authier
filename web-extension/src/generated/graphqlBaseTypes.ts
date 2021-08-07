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
};

export type Device = {
  __typename?: 'Device';
  firstIpAdress: Scalars['String'];
  lastIpAdress: Scalars['String'];
  firebaseToken: Scalars['String'];
  name: Scalars['String'];
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
  /** you need to be authenticated to call this resolver */
  authenticated: Scalars['String'];
  addDevice: Scalars['Boolean'];
  firebaseToken: Scalars['Boolean'];
  saveAuths: Scalars['Boolean'];
  addOTPEvent: Scalars['Boolean'];
  register: LoginResponse;
  revokeRefreshTokensForUser: Scalars['Boolean'];
  login: LoginResponse;
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
  /** you need to be authenticated to call this resolver */
  authenticated: Scalars['String'];
  users: Array<User>;
  me?: Maybe<User>;
  myDevices: Array<Device>;
  devicesCount: Scalars['Int'];
  sendAuthMessage: Scalars['Boolean'];
  sendConfirmation: Scalars['Boolean'];
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
};
