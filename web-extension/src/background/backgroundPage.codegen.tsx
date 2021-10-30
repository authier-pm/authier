import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type SaveSecretsMutationVariables = Types.Exact<{
  payload: Types.Scalars['String'];
  kind: Types.EncryptedSecretsType;
}>;


export type SaveSecretsMutation = { __typename?: 'Mutation', me?: Types.Maybe<{ __typename?: 'UserMutation', saveEncryptedSecrets: { __typename?: 'EncryptedSecrets', id: number } }> };


export const SaveSecretsDocument = gql`
    mutation saveSecrets($payload: String!, $kind: EncryptedSecretsType!) {
  me {
    saveEncryptedSecrets(payload: $payload, kind: $kind) {
      id
    }
  }
}
    `;
export type SaveSecretsMutationFn = Apollo.MutationFunction<SaveSecretsMutation, SaveSecretsMutationVariables>;

/**
 * __useSaveSecretsMutation__
 *
 * To run a mutation, you first call `useSaveSecretsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveSecretsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveSecretsMutation, { data, loading, error }] = useSaveSecretsMutation({
 *   variables: {
 *      payload: // value for 'payload'
 *      kind: // value for 'kind'
 *   },
 * });
 */
export function useSaveSecretsMutation(baseOptions?: Apollo.MutationHookOptions<SaveSecretsMutation, SaveSecretsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SaveSecretsMutation, SaveSecretsMutationVariables>(SaveSecretsDocument, options);
      }
export type SaveSecretsMutationHookResult = ReturnType<typeof useSaveSecretsMutation>;
export type SaveSecretsMutationResult = Apollo.MutationResult<SaveSecretsMutation>;
export type SaveSecretsMutationOptions = Apollo.BaseMutationOptions<SaveSecretsMutation, SaveSecretsMutationVariables>;