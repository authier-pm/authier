import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type SyncEncryptedSecretsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type SyncEncryptedSecretsQuery = { __typename?: 'Query', currentDevice: { __typename?: 'DeviceQuery', id: string, encryptedSecretsToSync: Array<{ __typename?: 'EncryptedSecretQuery', id: string, encrypted: string, kind: Types.EncryptedSecretType, createdAt: string, updatedAt?: string | null | undefined, url?: string | null | undefined, label: string }> } };


export const SyncEncryptedSecretsDocument = gql`
    query SyncEncryptedSecrets {
  currentDevice {
    id
    encryptedSecretsToSync {
      id
      encrypted
      kind
      createdAt
      updatedAt
      url
      label
    }
  }
}
    `;

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
export type SyncEncryptedSecretsQueryHookResult = ReturnType<typeof useSyncEncryptedSecretsQuery>;
export type SyncEncryptedSecretsLazyQueryHookResult = ReturnType<typeof useSyncEncryptedSecretsLazyQuery>;
export type SyncEncryptedSecretsQueryResult = Apollo.QueryResult<SyncEncryptedSecretsQuery, SyncEncryptedSecretsQueryVariables>;