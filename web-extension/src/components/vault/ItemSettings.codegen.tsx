import * as Types from '../../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UpdateEncryptedSecretMutationVariables = Types.Exact<{
  id: Types.Scalars['ID'];
  patch: Types.EncryptedSecretInput;
}>;


export type UpdateEncryptedSecretMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', encryptedSecret: { __typename?: 'EncryptedSecretMutation', id: string, update: { __typename?: 'EncryptedSecretGQL', id: string } } } };


export const UpdateEncryptedSecretDocument = gql`
    mutation updateEncryptedSecret($id: ID!, $patch: EncryptedSecretInput!) {
  me {
    encryptedSecret(id: $id) {
      id
      update(patch: $patch) {
        id
      }
    }
  }
}
    `;
export type UpdateEncryptedSecretMutationFn = Apollo.MutationFunction<UpdateEncryptedSecretMutation, UpdateEncryptedSecretMutationVariables>;

/**
 * __useUpdateEncryptedSecretMutation__
 *
 * To run a mutation, you first call `useUpdateEncryptedSecretMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateEncryptedSecretMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateEncryptedSecretMutation, { data, loading, error }] = useUpdateEncryptedSecretMutation({
 *   variables: {
 *      id: // value for 'id'
 *      patch: // value for 'patch'
 *   },
 * });
 */
export function useUpdateEncryptedSecretMutation(baseOptions?: Apollo.MutationHookOptions<UpdateEncryptedSecretMutation, UpdateEncryptedSecretMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateEncryptedSecretMutation, UpdateEncryptedSecretMutationVariables>(UpdateEncryptedSecretDocument, options);
      }
export type UpdateEncryptedSecretMutationHookResult = ReturnType<typeof useUpdateEncryptedSecretMutation>;
export type UpdateEncryptedSecretMutationResult = Apollo.MutationResult<UpdateEncryptedSecretMutation>;
export type UpdateEncryptedSecretMutationOptions = Apollo.BaseMutationOptions<UpdateEncryptedSecretMutation, UpdateEncryptedSecretMutationVariables>;