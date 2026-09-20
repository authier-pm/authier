/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type AddNewDeviceInput = {
  addDeviceSecret: string;
  addDeviceSecretEncrypted: string;
  devicePlatform: string;
  encryptionSalt: string;
  /** Firebase token is only used for mobile app */
  firebaseToken?: string | null | undefined;
};

export type DeviceInput = {
  id: string;
  name: string;
  platform: string;
};

export type EncryptedSecretType =
  | 'LOGIN_CREDENTIALS'
  | 'PASSKEY'
  | 'TOTP';

export type AddNewDeviceForUserMutationVariables = Exact<{
  email: string;
  deviceInput: Types.DeviceInput;
  currentAddDeviceSecret: string;
  input: Types.AddNewDeviceInput;
  deviceId: string;
}>;


export type AddNewDeviceForUserMutation = { deviceDecryptionChallenge:
    | { __typename: 'DecryptionChallengeApproved', id: number, addNewDeviceForUser: { accessToken: string, user: { id: string, uiLanguage: string, notificationOnVaultUnlock: boolean, notificationOnWrongPasswordAttempts: number, autofillForbiddenUrlPatterns: string, EncryptedSecrets: Array<{ id: string, encrypted: string, kind: Types.EncryptedSecretType, createdAt: string, updatedAt: string | null, version: number }>, device: { id: string, syncTOTP: boolean, vaultLockTimeoutSeconds: number, autofillTOTPEnabled: boolean }, defaultDeviceSettings: { id: number, autofillTOTPEnabled: boolean, theme: string, syncTOTP: boolean, vaultLockTimeoutSeconds: number } } } }
    | { __typename: 'DecryptionChallengeForApproval' }
   | null };

export type DeviceDecryptionChallengeMutationVariables = Exact<{
  email: string;
  deviceInput: Types.DeviceInput;
}>;


export type DeviceDecryptionChallengeMutation = { deviceDecryptionChallenge:
    | { __typename: 'DecryptionChallengeApproved', id: number, addDeviceSecretEncrypted: string, encryptionSalt: string, userId: string, approvedAt: string | null, deviceId: string, deviceName: string }
    | { __typename: 'DecryptionChallengeForApproval', id: number, pushNotificationsSentCount: number, pushNotificationsFailedCount: number, masterDeviceResetRequestedAt: string | null, masterDeviceResetProcessAt: string | null, masterDeviceResetConfirmedAt: string | null, masterDeviceResetRejectedAt: string | null, resetStatus: { requiredApprovals: number, approvalCount: number, processAt: string, expiresAt: string, confirmedAt: string | null, completedAt: string | null, rejectedAt: string | null } | null }
   | null };

export type InitiateMasterDeviceResetMutationVariables = Exact<{
  email: string;
  deviceInput: Types.DeviceInput;
  decryptionChallengeId: number;
}>;


export type InitiateMasterDeviceResetMutation = { initiateMasterDeviceReset: { requestedAt: string, processAt: string, alreadyPending: boolean } };


export const AddNewDeviceForUserDocument = gql`
    mutation addNewDeviceForUser($email: EmailAddress!, $deviceInput: DeviceInput!, $currentAddDeviceSecret: NonEmptyString!, $input: AddNewDeviceInput!, $deviceId: String!) {
  deviceDecryptionChallenge(email: $email, deviceInput: $deviceInput) {
    __typename
    ... on DecryptionChallengeApproved {
      id
      addNewDeviceForUser(
        currentAddDeviceSecret: $currentAddDeviceSecret
        input: $input
      ) {
        accessToken
        user {
          id
          uiLanguage
          EncryptedSecrets {
            id
            encrypted
            kind
            createdAt
            updatedAt
            version
          }
          notificationOnVaultUnlock
          notificationOnWrongPasswordAttempts
          autofillForbiddenUrlPatterns
          device(id: $deviceId) {
            id
            syncTOTP
            vaultLockTimeoutSeconds
            autofillTOTPEnabled
          }
          defaultDeviceSettings {
            id
            autofillTOTPEnabled
            theme
            syncTOTP
            vaultLockTimeoutSeconds
          }
        }
      }
    }
  }
}
    `;

/**
 * __useAddNewDeviceForUserMutation__
 *
 * To run a mutation, you first call `useAddNewDeviceForUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddNewDeviceForUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addNewDeviceForUserMutation, { data, loading, error }] = useAddNewDeviceForUserMutation({
 *   variables: {
 *      email: // value for 'email'
 *      deviceInput: // value for 'deviceInput'
 *      currentAddDeviceSecret: // value for 'currentAddDeviceSecret'
 *      input: // value for 'input'
 *      deviceId: // value for 'deviceId'
 *   },
 * });
 */
export function useAddNewDeviceForUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<AddNewDeviceForUserMutation, AddNewDeviceForUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<AddNewDeviceForUserMutation, AddNewDeviceForUserMutationVariables>(AddNewDeviceForUserDocument, options);
      }
export type AddNewDeviceForUserMutationHookResult = ReturnType<typeof useAddNewDeviceForUserMutation>;
export type AddNewDeviceForUserMutationResult = ApolloReactCommon.MutationResult<AddNewDeviceForUserMutation>;
export const DeviceDecryptionChallengeDocument = gql`
    mutation deviceDecryptionChallenge($email: EmailAddress!, $deviceInput: DeviceInput!) {
  deviceDecryptionChallenge(email: $email, deviceInput: $deviceInput) {
    __typename
    ... on DecryptionChallengeApproved {
      id
      addDeviceSecretEncrypted
      encryptionSalt
      userId
      approvedAt
      deviceId
      deviceName
    }
    ... on DecryptionChallengeForApproval {
      id
      pushNotificationsSentCount
      pushNotificationsFailedCount
      resetStatus {
        requiredApprovals
        approvalCount
        processAt
        expiresAt
        confirmedAt
        completedAt
        rejectedAt
      }
      masterDeviceResetRequestedAt
      masterDeviceResetProcessAt
      masterDeviceResetConfirmedAt
      masterDeviceResetRejectedAt
    }
  }
}
    `;

/**
 * __useDeviceDecryptionChallengeMutation__
 *
 * To run a mutation, you first call `useDeviceDecryptionChallengeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeviceDecryptionChallengeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deviceDecryptionChallengeMutation, { data, loading, error }] = useDeviceDecryptionChallengeMutation({
 *   variables: {
 *      email: // value for 'email'
 *      deviceInput: // value for 'deviceInput'
 *   },
 * });
 */
export function useDeviceDecryptionChallengeMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeviceDecryptionChallengeMutation, DeviceDecryptionChallengeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeviceDecryptionChallengeMutation, DeviceDecryptionChallengeMutationVariables>(DeviceDecryptionChallengeDocument, options);
      }
export type DeviceDecryptionChallengeMutationHookResult = ReturnType<typeof useDeviceDecryptionChallengeMutation>;
export type DeviceDecryptionChallengeMutationResult = ApolloReactCommon.MutationResult<DeviceDecryptionChallengeMutation>;
export const InitiateMasterDeviceResetDocument = gql`
    mutation initiateMasterDeviceReset($email: EmailAddress!, $deviceInput: DeviceInput!, $decryptionChallengeId: PositiveInt!) {
  initiateMasterDeviceReset(
    email: $email
    deviceInput: $deviceInput
    decryptionChallengeId: $decryptionChallengeId
  ) {
    requestedAt
    processAt
    alreadyPending
  }
}
    `;

/**
 * __useInitiateMasterDeviceResetMutation__
 *
 * To run a mutation, you first call `useInitiateMasterDeviceResetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInitiateMasterDeviceResetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [initiateMasterDeviceResetMutation, { data, loading, error }] = useInitiateMasterDeviceResetMutation({
 *   variables: {
 *      email: // value for 'email'
 *      deviceInput: // value for 'deviceInput'
 *      decryptionChallengeId: // value for 'decryptionChallengeId'
 *   },
 * });
 */
export function useInitiateMasterDeviceResetMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<InitiateMasterDeviceResetMutation, InitiateMasterDeviceResetMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<InitiateMasterDeviceResetMutation, InitiateMasterDeviceResetMutationVariables>(InitiateMasterDeviceResetDocument, options);
      }
export type InitiateMasterDeviceResetMutationHookResult = ReturnType<typeof useInitiateMasterDeviceResetMutation>;
export type InitiateMasterDeviceResetMutationResult = ApolloReactCommon.MutationResult<InitiateMasterDeviceResetMutation>;