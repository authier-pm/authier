import * as Types from '../generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type LimitsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type LimitsQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, loginCredentialsLimit: number, TOTPlimit: number, encryptedSecrets: Array<{ __typename?: 'EncryptedSecretQuery', kind: Types.EncryptedSecretType }> } };


export const LimitsDocument = gql`
    query Limits {
  me {
    id
    encryptedSecrets {
      kind
    }
    loginCredentialsLimit
    TOTPlimit
  }
}
    `;

/**
 * __useLimitsQuery__
 *
 * To run a query within a React component, call `useLimitsQuery` and pass it any options that fit your needs.
 * When your component renders, `useLimitsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLimitsQuery({
 *   variables: {
 *   },
 * });
 */
export function useLimitsQuery(baseOptions?: Apollo.QueryHookOptions<LimitsQuery, LimitsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LimitsQuery, LimitsQueryVariables>(LimitsDocument, options);
      }
export function useLimitsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LimitsQuery, LimitsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LimitsQuery, LimitsQueryVariables>(LimitsDocument, options);
        }
export function useLimitsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LimitsQuery, LimitsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<LimitsQuery, LimitsQueryVariables>(LimitsDocument, options);
        }
export type LimitsQueryHookResult = ReturnType<typeof useLimitsQuery>;
export type LimitsLazyQueryHookResult = ReturnType<typeof useLimitsLazyQuery>;
export type LimitsSuspenseQueryHookResult = ReturnType<typeof useLimitsSuspenseQuery>;
export type LimitsQueryResult = Apollo.QueryResult<LimitsQuery, LimitsQueryVariables>;