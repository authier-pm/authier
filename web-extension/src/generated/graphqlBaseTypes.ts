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

export type EncryptedAuths = {
  __typename?: 'EncryptedAuths';
  id: Scalars['Int'];
  encrypted: Scalars['String'];
  version: Scalars['Int'];
};

export type LoginResponse = {
  __typename?: 'LoginResponse';
  accessToken: Scalars['String'];
  auths: EncryptedAuths;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** you need to be authenticated to call this resolver */
  authenticated: Scalars['String'];
  addDevice: Scalars['Boolean'];
  saveAuths: Scalars['Boolean'];
  addOTPEvent: Scalars['Boolean'];
  register: LoginResponse;
  revokeRefreshTokensForUser: Scalars['Boolean'];
  login: LoginResponse;
};


export type MutationAddDeviceArgs = {
  userId: Scalars['String'];
  firstIpAdress: Scalars['String'];
  name: Scalars['String'];
};


export type MutationSaveAuthsArgs = {
  payload: Scalars['String'];
  userId: Scalars['String'];
};


export type MutationAddOtpEventArgs = {
  data: OtpEvent;
};


export type MutationRegisterArgs = {
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
  DeviceCount: Scalars['Int'];
};


export type QueryDeviceCountArgs = {
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
