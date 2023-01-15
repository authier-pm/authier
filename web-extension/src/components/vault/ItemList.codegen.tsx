import * as Types from '../../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type DeleteEncryptedSecretMutationVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type DeleteEncryptedSecretMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', encryptedSecret: { __typename?: 'EncryptedSecretMutation', id: string, delete: { __typename?: 'EncryptedSecretGQL', id: string } } } };


export const DeleteEncryptedSecretDocument = gql`
    mutation deleteEncryptedSecret($id: ID!) {
  me {
    encryptedSecret(id: $id) {
      id
      delete {
        id
      }
    }
  }
}
    `;
export type DeleteEncryptedSecretMutationFn = Apollo.MutationFunction<DeleteEncryptedSecretMutation, DeleteEncryptedSecretMutationVariables>;

/**
 * __useDeleteEncryptedSecretMutation__
 *
 * To run a mutation, you first call `useDeleteEncryptedSecretMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteEncryptedSecretMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteEncryptedSecretMutation, { data, loading, error }] = useDeleteEncryptedSecretMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteEncryptedSecretMutation(baseOptions?: Apollo.MutationHookOptions<DeleteEncryptedSecretMutation, DeleteEncryptedSecretMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteEncryptedSecretMutation, DeleteEncryptedSecretMutationVariables>(DeleteEncryptedSecretDocument, options);
      }
export type DeleteEncryptedSecretMutationHookResult = ReturnType<typeof useDeleteEncryptedSecretMutation>;
export type DeleteEncryptedSecretMutationResult = Apollo.MutationResult<DeleteEncryptedSecretMutation>;
export type DeleteEncryptedSecretMutationOptions = Apollo.BaseMutationOptions<DeleteEncryptedSecretMutation, DeleteEncryptedSecretMutationVariables>;