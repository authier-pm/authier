import * as Types from '../../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type SecuritySettingsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type SecuritySettingsQuery = { __typename?: 'Query', me?: { __typename?: 'UserQuery', id: string, settings: { __typename?: 'SettingsConfigGQL', lockTime: number, twoFA: boolean, noHandsLogin: boolean, homeUI: string } } | null };


export const SecuritySettingsDocument = gql`
    query SecuritySettings {
  me {
    id
    settings {
      lockTime
      twoFA
      noHandsLogin
      homeUI
    }
  }
}
    `;

/**
 * __useSecuritySettingsQuery__
 *
 * To run a query within a React component, call `useSecuritySettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSecuritySettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSecuritySettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSecuritySettingsQuery(baseOptions?: Apollo.QueryHookOptions<SecuritySettingsQuery, SecuritySettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SecuritySettingsQuery, SecuritySettingsQueryVariables>(SecuritySettingsDocument, options);
      }
export function useSecuritySettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SecuritySettingsQuery, SecuritySettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SecuritySettingsQuery, SecuritySettingsQueryVariables>(SecuritySettingsDocument, options);
        }
export type SecuritySettingsQueryHookResult = ReturnType<typeof useSecuritySettingsQuery>;
export type SecuritySettingsLazyQueryHookResult = ReturnType<typeof useSecuritySettingsLazyQuery>;
export type SecuritySettingsQueryResult = Apollo.QueryResult<SecuritySettingsQuery, SecuritySettingsQueryVariables>;