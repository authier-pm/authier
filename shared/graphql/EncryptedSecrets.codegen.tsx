import * as Types from '../generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type EncryptedSecretsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type EncryptedSecretsQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, encryptedSecrets: Array<{ __typename?: 'EncryptedSecretQuery', id: string, kind: Types.EncryptedSecretType, encrypted: string }> } };

export type DeleteEncryptedSecretMutationVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type DeleteEncryptedSecretMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', encryptedSecret: { __typename?: 'EncryptedSecretMutation', id: string, delete: { __typename?: 'EncryptedSecretGQL', id: string } } } };

export type RemoveEncryptedSecretsMutationVariables = Types.Exact<{
  secrets: Array<Types.Scalars['UUID']['input']> | Types.Scalars['UUID']['input'];
}>;


export type RemoveEncryptedSecretsMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', removeEncryptedSecrets: Array<{ __typename?: 'EncryptedSecretMutation', id: string }> } };

export type UpdateEncryptedSecretMutationVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
  patch: Types.EncryptedSecretInput;
}>;


export type UpdateEncryptedSecretMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', encryptedSecret: { __typename?: 'EncryptedSecretMutation', id: string, update: { __typename?: 'EncryptedSecretGQL', id: string } } } };


export const EncryptedSecretsDocument = gql`
    query encryptedSecrets {
  me {
    id
    encryptedSecrets {
      id
      kind
      encrypted
    }
  }
}
    `;

/**
 * __useEncryptedSecretsQuery__
 *
 * To run a query within a React component, call `useEncryptedSecretsQuery` and pass it any options that fit your needs.
 * When your component renders, `useEncryptedSecretsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEncryptedSecretsQuery({
 *   variables: {
 *   },
 * });
 */
export function useEncryptedSecretsQuery(baseOptions?: Apollo.QueryHookOptions<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>(EncryptedSecretsDocument, options);
      }
export function useEncryptedSecretsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>(EncryptedSecretsDocument, options);
        }
export type EncryptedSecretsQueryHookResult = ReturnType<typeof useEncryptedSecretsQuery>;
export type EncryptedSecretsLazyQueryHookResult = ReturnType<typeof useEncryptedSecretsLazyQuery>;
export type EncryptedSecretsQueryResult = Apollo.QueryResult<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>;
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
export const RemoveEncryptedSecretsDocument = gql`
    mutation removeEncryptedSecrets($secrets: [UUID!]!) {
  me {
    removeEncryptedSecrets(secrets: $secrets) {
      id
    }
  }
}
    `;
export type RemoveEncryptedSecretsMutationFn = Apollo.MutationFunction<RemoveEncryptedSecretsMutation, RemoveEncryptedSecretsMutationVariables>;

/**
 * __useRemoveEncryptedSecretsMutation__
 *
 * To run a mutation, you first call `useRemoveEncryptedSecretsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveEncryptedSecretsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeEncryptedSecretsMutation, { data, loading, error }] = useRemoveEncryptedSecretsMutation({
 *   variables: {
 *      secrets: // value for 'secrets'
 *   },
 * });
 */
export function useRemoveEncryptedSecretsMutation(baseOptions?: Apollo.MutationHookOptions<RemoveEncryptedSecretsMutation, RemoveEncryptedSecretsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveEncryptedSecretsMutation, RemoveEncryptedSecretsMutationVariables>(RemoveEncryptedSecretsDocument, options);
      }
export type RemoveEncryptedSecretsMutationHookResult = ReturnType<typeof useRemoveEncryptedSecretsMutation>;
export type RemoveEncryptedSecretsMutationResult = Apollo.MutationResult<RemoveEncryptedSecretsMutation>;
export type RemoveEncryptedSecretsMutationOptions = Apollo.BaseMutationOptions<RemoveEncryptedSecretsMutation, RemoveEncryptedSecretsMutationVariables>;
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