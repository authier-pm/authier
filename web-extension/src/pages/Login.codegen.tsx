import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type AddNewDeviceForUserMutationVariables = Types.Exact<{
  email: Types.Scalars['EmailAddress'];
  deviceId: Types.Scalars['UUID'];
  currentAddDeviceSecret: Types.Scalars['NonEmptyString'];
  input: Types.AddNewDeviceInput;
}>;


export type AddNewDeviceForUserMutation = { __typename?: 'Mutation', deviceDecryptionChallenge?: { __typename?: 'DecryptionChallengeApproved', id: number, addNewDeviceForUser: { __typename?: 'LoginResponse', accessToken: string, user: { __typename?: 'UserMutation', EncryptedSecrets: Array<{ __typename?: 'EncryptedSecretGQL', id: string, encrypted: string, kind: Types.EncryptedSecretType, createdAt: string, updatedAt?: string | null | undefined, iconUrl?: string | null | undefined, url?: string | null | undefined, label: string, version: number }> } } } | { __typename?: 'DecryptionChallengeForApproval' } | null | undefined };

export type DeviceDecryptionChallengeMutationVariables = Types.Exact<{
  email: Types.Scalars['EmailAddress'];
  deviceId: Types.Scalars['UUID'];
}>;


export type DeviceDecryptionChallengeMutation = { __typename?: 'Mutation', deviceDecryptionChallenge?: { __typename?: 'DecryptionChallengeApproved', id: number, addDeviceSecretEncrypted: string, encryptionSalt: string, userId: string, approvedAt?: string | null | undefined } | { __typename?: 'DecryptionChallengeForApproval', id: number, approvedAt?: string | null | undefined } | null | undefined };


export const AddNewDeviceForUserDocument = gql`
    mutation addNewDeviceForUser($email: EmailAddress!, $deviceId: UUID!, $currentAddDeviceSecret: NonEmptyString!, $input: AddNewDeviceInput!) {
  deviceDecryptionChallenge(email: $email, deviceId: $deviceId) {
    ... on DecryptionChallengeApproved {
      id
      addNewDeviceForUser(
        currentAddDeviceSecret: $currentAddDeviceSecret
        input: $input
      ) {
        accessToken
        user {
          EncryptedSecrets {
            id
            encrypted
            kind
            createdAt
            updatedAt
            iconUrl
            url
            label
            version
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
 *      deviceId: // value for 'deviceId'
 *      currentAddDeviceSecret: // value for 'currentAddDeviceSecret'
 *      input: // value for 'input'
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
    mutation deviceDecryptionChallenge($email: EmailAddress!, $deviceId: UUID!) {
  deviceDecryptionChallenge(email: $email, deviceId: $deviceId) {
    ... on DecryptionChallengeApproved {
      id
      addDeviceSecretEncrypted
      encryptionSalt
      userId
      approvedAt
    }
    ... on DecryptionChallengeForApproval {
      id
      approvedAt
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
 *      deviceId: // value for 'deviceId'
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