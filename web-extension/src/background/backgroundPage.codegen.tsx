import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type AddEncryptedSecretMutationVariables = Types.Exact<{
  payload: Types.EncryptedSecretInput;
}>;


export type AddEncryptedSecretMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', addEncryptedSecret: { __typename?: 'EncryptedSecretQuery', id: string, kind: Types.EncryptedSecretType, encrypted: string, url?: string | null | undefined, iconUrl?: string | null | undefined, label: string, version: number, createdAt: string, updatedAt?: string | null | undefined } } };


export const AddEncryptedSecretDocument = gql`
    mutation addEncryptedSecret($payload: EncryptedSecretInput!) {
  me {
    addEncryptedSecret(payload: $payload) {
      id
      kind
      encrypted
      url
      iconUrl
      label
      version
      createdAt
      updatedAt
    }
  }
}
    `;
export type AddEncryptedSecretMutationFn = Apollo.MutationFunction<AddEncryptedSecretMutation, AddEncryptedSecretMutationVariables>;

/**
 * __useAddEncryptedSecretMutation__
 *
 * To run a mutation, you first call `useAddEncryptedSecretMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddEncryptedSecretMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addEncryptedSecretMutation, { data, loading, error }] = useAddEncryptedSecretMutation({
 *   variables: {
 *      payload: // value for 'payload'
 *   },
 * });
 */
export function useAddEncryptedSecretMutation(baseOptions?: Apollo.MutationHookOptions<AddEncryptedSecretMutation, AddEncryptedSecretMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddEncryptedSecretMutation, AddEncryptedSecretMutationVariables>(AddEncryptedSecretDocument, options);
      }
export type AddEncryptedSecretMutationHookResult = ReturnType<typeof useAddEncryptedSecretMutation>;
export type AddEncryptedSecretMutationResult = Apollo.MutationResult<AddEncryptedSecretMutation>;
export type AddEncryptedSecretMutationOptions = Apollo.BaseMutationOptions<AddEncryptedSecretMutation, AddEncryptedSecretMutationVariables>;