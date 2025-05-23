import * as Types from '../generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type LogoutMutationVariables = Types.Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', currentDevice: { __typename?: 'DeviceMutation', logout: { __typename?: 'DeviceGQL', logoutAt?: string | null } } };

export type MarkAsSyncedMutationVariables = Types.Exact<{ [key: string]: never; }>;


export type MarkAsSyncedMutation = { __typename?: 'Mutation', currentDevice: { __typename?: 'DeviceMutation', markAsSynced: string } };

export type SyncEncryptedSecretsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type SyncEncryptedSecretsQuery = { __typename?: 'Query', currentDevice: { __typename?: 'DeviceQuery', id: string, encryptedSecretsToSync: Array<{ __typename?: 'EncryptedSecretQuery', id: string, encrypted: string, kind: Types.EncryptedSecretType, createdAt: string, updatedAt?: string | null, deletedAt?: string | null, version: number }> } };

export type SecretExtensionFragment = { __typename?: 'EncryptedSecretQuery', id: string, encrypted: string, kind: Types.EncryptedSecretType, createdAt: string, updatedAt?: string | null, deletedAt?: string | null, version: number };

export type AddEncryptedSecretsMutationVariables = Types.Exact<{
  secrets: Array<Types.EncryptedSecretInput> | Types.EncryptedSecretInput;
}>;


export type AddEncryptedSecretsMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', addEncryptedSecrets: Array<{ __typename?: 'EncryptedSecretQuery', id: string, kind: Types.EncryptedSecretType, encrypted: string, version: number, createdAt: string, updatedAt?: string | null }> } };

export const SecretExtensionFragmentDoc = gql`
    fragment secretExtension on EncryptedSecretQuery {
  id
  encrypted
  kind
  createdAt
  updatedAt
  deletedAt
  version
}
    `;
export const LogoutDocument = gql`
    mutation logout {
  currentDevice {
    logout {
      logoutAt
    }
  }
}
    `;
export type LogoutMutationFn = Apollo.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: Apollo.MutationHookOptions<LogoutMutation, LogoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, options);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = Apollo.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = Apollo.BaseMutationOptions<LogoutMutation, LogoutMutationVariables>;
export const MarkAsSyncedDocument = gql`
    mutation markAsSynced {
  currentDevice {
    markAsSynced
  }
}
    `;
export type MarkAsSyncedMutationFn = Apollo.MutationFunction<MarkAsSyncedMutation, MarkAsSyncedMutationVariables>;

/**
 * __useMarkAsSyncedMutation__
 *
 * To run a mutation, you first call `useMarkAsSyncedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkAsSyncedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markAsSyncedMutation, { data, loading, error }] = useMarkAsSyncedMutation({
 *   variables: {
 *   },
 * });
 */
export function useMarkAsSyncedMutation(baseOptions?: Apollo.MutationHookOptions<MarkAsSyncedMutation, MarkAsSyncedMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<MarkAsSyncedMutation, MarkAsSyncedMutationVariables>(MarkAsSyncedDocument, options);
      }
export type MarkAsSyncedMutationHookResult = ReturnType<typeof useMarkAsSyncedMutation>;
export type MarkAsSyncedMutationResult = Apollo.MutationResult<MarkAsSyncedMutation>;
export type MarkAsSyncedMutationOptions = Apollo.BaseMutationOptions<MarkAsSyncedMutation, MarkAsSyncedMutationVariables>;
export const SyncEncryptedSecretsDocument = gql`
    query SyncEncryptedSecrets {
  currentDevice {
    id
    encryptedSecretsToSync {
      id
      ...secretExtension
    }
  }
}
    ${SecretExtensionFragmentDoc}`;

/**
 * __useSyncEncryptedSecretsQuery__
 *
 * To run a query within a React component, call `useSyncEncryptedSecretsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSyncEncryptedSecretsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSyncEncryptedSecretsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSyncEncryptedSecretsQuery(baseOptions?: Apollo.QueryHookOptions<SyncEncryptedSecretsQuery, SyncEncryptedSecretsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SyncEncryptedSecretsQuery, SyncEncryptedSecretsQueryVariables>(SyncEncryptedSecretsDocument, options);
      }
export function useSyncEncryptedSecretsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SyncEncryptedSecretsQuery, SyncEncryptedSecretsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SyncEncryptedSecretsQuery, SyncEncryptedSecretsQueryVariables>(SyncEncryptedSecretsDocument, options);
        }
export function useSyncEncryptedSecretsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SyncEncryptedSecretsQuery, SyncEncryptedSecretsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SyncEncryptedSecretsQuery, SyncEncryptedSecretsQueryVariables>(SyncEncryptedSecretsDocument, options);
        }
export type SyncEncryptedSecretsQueryHookResult = ReturnType<typeof useSyncEncryptedSecretsQuery>;
export type SyncEncryptedSecretsLazyQueryHookResult = ReturnType<typeof useSyncEncryptedSecretsLazyQuery>;
export type SyncEncryptedSecretsSuspenseQueryHookResult = ReturnType<typeof useSyncEncryptedSecretsSuspenseQuery>;
export type SyncEncryptedSecretsQueryResult = Apollo.QueryResult<SyncEncryptedSecretsQuery, SyncEncryptedSecretsQueryVariables>;
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