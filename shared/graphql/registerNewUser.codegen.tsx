/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type RegisterNewAccountInput = {
  addDeviceSecret: string;
  addDeviceSecretEncrypted: string;
  deviceId: string | number;
  deviceName: string;
  devicePlatform: string;
  email: string;
  encryptionSalt: string;
  /** Firebase token is only used for mobile app */
  firebaseToken?: string | null | undefined;
  masterDeviceResetConfig?: unknown;
};

export type RegisterNewUserMutationVariables = Exact<{
  input: Types.RegisterNewAccountInput;
  userId: string;
}>;


export type RegisterNewUserMutation = { registerNewUser: { accessToken: string, user: { id: string, sendEmailVerification: number, notificationOnVaultUnlock: boolean, notificationOnWrongPasswordAttempts: number, Devices: Array<{ id: string, name: string }> } } };


export const RegisterNewUserDocument = gql`
    mutation registerNewUser($input: RegisterNewAccountInput!, $userId: UUID!) {
  registerNewUser(input: $input, userId: $userId) {
    accessToken
    user {
      id
      sendEmailVerification
      Devices {
        id
        name
      }
      notificationOnVaultUnlock
      notificationOnWrongPasswordAttempts
    }
  }
}
    `;

/**
 * __useRegisterNewUserMutation__
 *
 * To run a mutation, you first call `useRegisterNewUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterNewUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerNewUserMutation, { data, loading, error }] = useRegisterNewUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useRegisterNewUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RegisterNewUserMutation, RegisterNewUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RegisterNewUserMutation, RegisterNewUserMutationVariables>(RegisterNewUserDocument, options);
      }
export type RegisterNewUserMutationHookResult = ReturnType<typeof useRegisterNewUserMutation>;
export type RegisterNewUserMutationResult = ApolloReactCommon.MutationResult<RegisterNewUserMutation>;