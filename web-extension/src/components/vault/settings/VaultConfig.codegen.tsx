import * as Types from '../../../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type SyncSettingsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type SyncSettingsQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, autofill: boolean, language: string, theme: string, device: { __typename?: 'DeviceQuery', id: string, syncTOTP: boolean, vaultLockTimeoutSeconds?: number | null } } };


export const SyncSettingsDocument = gql`
    query SyncSettings {
  me {
    id
    autofill
    language
    theme
    device {
      id
      syncTOTP
      vaultLockTimeoutSeconds
    }
  }
}
    `;

/**
 * __useSyncSettingsQuery__
 *
 * To run a query within a React component, call `useSyncSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSyncSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSyncSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSyncSettingsQuery(baseOptions?: Apollo.QueryHookOptions<SyncSettingsQuery, SyncSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SyncSettingsQuery, SyncSettingsQueryVariables>(SyncSettingsDocument, options);
      }
export function useSyncSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SyncSettingsQuery, SyncSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SyncSettingsQuery, SyncSettingsQueryVariables>(SyncSettingsDocument, options);
        }
export type SyncSettingsQueryHookResult = ReturnType<typeof useSyncSettingsQuery>;
export type SyncSettingsLazyQueryHookResult = ReturnType<typeof useSyncSettingsLazyQuery>;
export type SyncSettingsQueryResult = Apollo.QueryResult<SyncSettingsQuery, SyncSettingsQueryVariables>;