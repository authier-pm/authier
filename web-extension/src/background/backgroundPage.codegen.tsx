import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type AddEncryptedSecretsMutationVariables = Types.Exact<{
  secrets: Array<Types.EncryptedSecretInput> | Types.EncryptedSecretInput;
}>;


export type AddEncryptedSecretsMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', addEncryptedSecrets: Array<{ __typename?: 'EncryptedSecretQuery', id: string, kind: Types.EncryptedSecretType, encrypted: string, version: number, createdAt: any, updatedAt?: any | null }> } };


export const AddEncryptedSecretsDocument = gql`
    mutation addEncryptedSecrets($secrets: [EncryptedSecretInput!]!) {
  me {
    addEncryptedSecrets(secrets: $secrets) {
      id
      kind
      encrypted
      version
      createdAt
      updatedAt
    }
  }
}
    `;
export type AddEncryptedSecretsMutationFn = Apollo.MutationFunction<AddEncryptedSecretsMutation, AddEncryptedSecretsMutationVariables>;

/**
 * __useAddEncryptedSecretsMutation__
 *
 * To run a mutation, you first call `useAddEncryptedSecretsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddEncryptedSecretsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addEncryptedSecretsMutation, { data, loading, error }] = useAddEncryptedSecretsMutation({
 *   variables: {
 *      secrets: // value for 'secrets'
 *   },
 * });
 */
export function useAddEncryptedSecretsMutation(baseOptions?: Apollo.MutationHookOptions<AddEncryptedSecretsMutation, AddEncryptedSecretsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddEncryptedSecretsMutation, AddEncryptedSecretsMutationVariables>(AddEncryptedSecretsDocument, options);
      }
export type AddEncryptedSecretsMutationHookResult = ReturnType<typeof useAddEncryptedSecretsMutation>;
export type AddEncryptedSecretsMutationResult = Apollo.MutationResult<AddEncryptedSecretsMutation>;
export type AddEncryptedSecretsMutationOptions = Apollo.BaseMutationOptions<AddEncryptedSecretsMutation, AddEncryptedSecretsMutationVariables>;