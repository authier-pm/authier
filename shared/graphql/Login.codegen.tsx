import * as Types from '../generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type AddNewDeviceForUserMutationVariables = Types.Exact<{
  email: Types.Scalars['EmailAddress']['input'];
  deviceInput: Types.DeviceInput;
  currentAddDeviceSecret: Types.Scalars['NonEmptyString']['input'];
  input: Types.AddNewDeviceInput;
  deviceId: Types.Scalars['String']['input'];
}>;


export type AddNewDeviceForUserMutation = { __typename?: 'Mutation', deviceDecryptionChallenge?:
    | { __typename?: 'DecryptionChallengeApproved', id: number, addNewDeviceForUser: { __typename?: 'LoginResponse', accessToken: string, user: { __typename?: 'UserMutation', id: string, uiLanguage: string, notificationOnVaultUnlock: boolean, notificationOnWrongPasswordAttempts: number, EncryptedSecrets: Array<{ __typename?: 'EncryptedSecretGQL', id: string, encrypted: string, kind: Types.EncryptedSecretType, createdAt: string, updatedAt?: string | null, version: number }>, device: { __typename?: 'DeviceMutation', id: string, syncTOTP: boolean, vaultLockTimeoutSeconds: number, autofillCredentialsEnabled: boolean, autofillTOTPEnabled: boolean }, defaultDeviceSettings: { __typename?: 'DefaultDeviceSettingsMutation', id: number, autofillTOTPEnabled: boolean, autofillCredentialsEnabled: boolean, theme: string, syncTOTP: boolean, vaultLockTimeoutSeconds: number } } } }
    | { __typename?: 'DecryptionChallengeForApproval' }
   | null };

export type DeviceDecryptionChallengeMutationVariables = Types.Exact<{
  email: Types.Scalars['EmailAddress']['input'];
  deviceInput: Types.DeviceInput;
}>;


export type DeviceDecryptionChallengeMutation = { __typename?: 'Mutation', deviceDecryptionChallenge?:
    | { __typename?: 'DecryptionChallengeApproved', id: number, addDeviceSecretEncrypted: string, encryptionSalt: string, userId: string, approvedAt?: string | null, deviceId: string, deviceName: string }
    | { __typename?: 'DecryptionChallengeForApproval', id: number }
   | null };


export const AddNewDeviceForUserDocument = gql`
    mutation addNewDeviceForUser($email: EmailAddress!, $deviceInput: DeviceInput!, $currentAddDeviceSecret: NonEmptyString!, $input: AddNewDeviceInput!, $deviceId: String!) {
  deviceDecryptionChallenge(email: $email, deviceInput: $deviceInput) {
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
          device(id: $deviceId) {
            id
            syncTOTP
            vaultLockTimeoutSeconds
            autofillCredentialsEnabled
            autofillTOTPEnabled
          }
          defaultDeviceSettings {
            id
            autofillTOTPEnabled
            autofillCredentialsEnabled
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
export type AddNewDeviceForUserMutationFn = Apollo.MutationFunction<AddNewDeviceForUserMutation, AddNewDeviceForUserMutationVariables>;

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
export function useAddNewDeviceForUserMutation(baseOptions?: Apollo.MutationHookOptions<AddNewDeviceForUserMutation, AddNewDeviceForUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddNewDeviceForUserMutation, AddNewDeviceForUserMutationVariables>(AddNewDeviceForUserDocument, options);
      }
export type AddNewDeviceForUserMutationHookResult = ReturnType<typeof useAddNewDeviceForUserMutation>;
export type AddNewDeviceForUserMutationResult = Apollo.MutationResult<AddNewDeviceForUserMutation>;
export type AddNewDeviceForUserMutationOptions = Apollo.BaseMutationOptions<AddNewDeviceForUserMutation, AddNewDeviceForUserMutationVariables>;
export const DeviceDecryptionChallengeDocument = gql`
    mutation deviceDecryptionChallenge($email: EmailAddress!, $deviceInput: DeviceInput!) {
  deviceDecryptionChallenge(email: $email, deviceInput: $deviceInput) {
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
    }
  }
}
    `;
export type DeviceDecryptionChallengeMutationFn = Apollo.MutationFunction<DeviceDecryptionChallengeMutation, DeviceDecryptionChallengeMutationVariables>;

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
export function useDeviceDecryptionChallengeMutation(baseOptions?: Apollo.MutationHookOptions<DeviceDecryptionChallengeMutation, DeviceDecryptionChallengeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeviceDecryptionChallengeMutation, DeviceDecryptionChallengeMutationVariables>(DeviceDecryptionChallengeDocument, options);
      }
export type DeviceDecryptionChallengeMutationHookResult = ReturnType<typeof useDeviceDecryptionChallengeMutation>;
export type DeviceDecryptionChallengeMutationResult = Apollo.MutationResult<DeviceDecryptionChallengeMutation>;
export type DeviceDecryptionChallengeMutationOptions = Apollo.BaseMutationOptions<DeviceDecryptionChallengeMutation, DeviceDecryptionChallengeMutationVariables>;