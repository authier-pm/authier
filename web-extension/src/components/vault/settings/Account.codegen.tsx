import * as Types from '../../../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type ChangeMasterPasswordMutationVariables = Types.Exact<{
  secrets: Array<Types.EncryptedSecretPatchInput> | Types.EncryptedSecretPatchInput;
  addDeviceSecret: Types.Scalars['NonEmptyString'];
  addDeviceSecretEncrypted: Types.Scalars['NonEmptyString'];
  decryptionChallengeId: Types.Scalars['PositiveInt'];
}>;


export type ChangeMasterPasswordMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', changeMasterPassword: number } };


export const ChangeMasterPasswordDocument = gql`
    mutation changeMasterPassword($secrets: [EncryptedSecretPatchInput!]!, $addDeviceSecret: NonEmptyString!, $addDeviceSecretEncrypted: NonEmptyString!, $decryptionChallengeId: PositiveInt!) {
  me {
    changeMasterPassword(
      input: {secrets: $secrets, addDeviceSecret: $addDeviceSecret, addDeviceSecretEncrypted: $addDeviceSecretEncrypted, decryptionChallengeId: $decryptionChallengeId}
    )
  }
}
    `;
export type ChangeMasterPasswordMutationFn = Apollo.MutationFunction<ChangeMasterPasswordMutation, ChangeMasterPasswordMutationVariables>;

/**
 * __useChangeMasterPasswordMutation__
 *
 * To run a mutation, you first call `useChangeMasterPasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangeMasterPasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changeMasterPasswordMutation, { data, loading, error }] = useChangeMasterPasswordMutation({
 *   variables: {
 *      secrets: // value for 'secrets'
 *      addDeviceSecret: // value for 'addDeviceSecret'
 *      addDeviceSecretEncrypted: // value for 'addDeviceSecretEncrypted'
 *      decryptionChallengeId: // value for 'decryptionChallengeId'
 *   },
 * });
 */
export function useChangeMasterPasswordMutation(baseOptions?: Apollo.MutationHookOptions<ChangeMasterPasswordMutation, ChangeMasterPasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ChangeMasterPasswordMutation, ChangeMasterPasswordMutationVariables>(ChangeMasterPasswordDocument, options);
      }
export type ChangeMasterPasswordMutationHookResult = ReturnType<typeof useChangeMasterPasswordMutation>;
export type ChangeMasterPasswordMutationResult = Apollo.MutationResult<ChangeMasterPasswordMutation>;
export type ChangeMasterPasswordMutationOptions = Apollo.BaseMutationOptions<ChangeMasterPasswordMutation, ChangeMasterPasswordMutationVariables>;