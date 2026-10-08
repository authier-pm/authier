/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type EncryptedSecretInput = {
  encrypted: string;
  kind: EncryptedSecretType;
};

export type EncryptedSecretType =
  | 'LOGIN_CREDENTIALS'
  | 'PASSKEY'
  | 'TOTP';

export type EncryptedSecretsQueryVariables = Exact<{ [key: string]: never; }>;


export type EncryptedSecretsQuery = { me: { id: string, encryptedSecrets: Array<{ id: string, kind: Types.EncryptedSecretType, encrypted: string }> } };

export type DeleteEncryptedSecretMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteEncryptedSecretMutation = { me: { encryptedSecret: { id: string, delete: { id: string } } } };

export type RemoveEncryptedSecretsMutationVariables = Exact<{
  secrets: Array<string> | string;
}>;


export type RemoveEncryptedSecretsMutation = { me: { removeEncryptedSecrets: Array<{ id: string }> } };

export type UpdateEncryptedSecretMutationVariables = Exact<{
  id: string | number;
  patch: Types.EncryptedSecretInput;
}>;


export type UpdateEncryptedSecretMutation = { me: { encryptedSecret: { id: string, update: { id: string, version: number } } } };


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
export function useEncryptedSecretsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>(EncryptedSecretsDocument, options);
      }
export function useEncryptedSecretsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>(EncryptedSecretsDocument, options);
        }
// @ts-ignore
export function useEncryptedSecretsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>;
// @ts-ignore
export function useEncryptedSecretsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<EncryptedSecretsQuery | undefined, EncryptedSecretsQueryVariables>;
export function useEncryptedSecretsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>(EncryptedSecretsDocument, options);
        }
export type EncryptedSecretsQueryHookResult = ReturnType<typeof useEncryptedSecretsQuery>;
export type EncryptedSecretsLazyQueryHookResult = ReturnType<typeof useEncryptedSecretsLazyQuery>;
export type EncryptedSecretsSuspenseQueryHookResult = ReturnType<typeof useEncryptedSecretsSuspenseQuery>;
export type EncryptedSecretsQueryResult = ApolloReactCommon.QueryResult<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>;
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
export function useDeleteEncryptedSecretMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteEncryptedSecretMutation, DeleteEncryptedSecretMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteEncryptedSecretMutation, DeleteEncryptedSecretMutationVariables>(DeleteEncryptedSecretDocument, options);
      }
export type DeleteEncryptedSecretMutationHookResult = ReturnType<typeof useDeleteEncryptedSecretMutation>;
export type DeleteEncryptedSecretMutationResult = ApolloReactCommon.MutationResult<DeleteEncryptedSecretMutation>;
export const RemoveEncryptedSecretsDocument = gql`
    mutation removeEncryptedSecrets($secrets: [UUID!]!) {
  me {
    removeEncryptedSecrets(secrets: $secrets) {
      id
    }
  }
}
    `;

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
export function useRemoveEncryptedSecretsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RemoveEncryptedSecretsMutation, RemoveEncryptedSecretsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RemoveEncryptedSecretsMutation, RemoveEncryptedSecretsMutationVariables>(RemoveEncryptedSecretsDocument, options);
      }
export type RemoveEncryptedSecretsMutationHookResult = ReturnType<typeof useRemoveEncryptedSecretsMutation>;
export type RemoveEncryptedSecretsMutationResult = ApolloReactCommon.MutationResult<RemoveEncryptedSecretsMutation>;
export const UpdateEncryptedSecretDocument = gql`
    mutation updateEncryptedSecret($id: ID!, $patch: EncryptedSecretInput!) {
  me {
    encryptedSecret(id: $id) {
      id
      update(patch: $patch) {
        id
        version
      }
    }
  }
}
    `;

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
export function useUpdateEncryptedSecretMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateEncryptedSecretMutation, UpdateEncryptedSecretMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateEncryptedSecretMutation, UpdateEncryptedSecretMutationVariables>(UpdateEncryptedSecretDocument, options);
      }
export type UpdateEncryptedSecretMutationHookResult = ReturnType<typeof useUpdateEncryptedSecretMutation>;
export type UpdateEncryptedSecretMutationResult = ApolloReactCommon.MutationResult<UpdateEncryptedSecretMutation>;