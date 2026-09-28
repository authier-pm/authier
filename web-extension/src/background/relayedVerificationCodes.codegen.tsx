import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type RelayedVerificationCodesQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type RelayedVerificationCodesQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, relayedVerificationCodes: Array<{ __typename?: 'RelayedVerificationCodeGQL', id: string, encrypted: string, expiresAt: string, deviceName: string }> } };


export const RelayedVerificationCodesDocument = gql`
    query relayedVerificationCodes {
  me {
    id
    relayedVerificationCodes {
      id
      encrypted
      expiresAt
      deviceName
    }
  }
}
    `;

/**
 * __useRelayedVerificationCodesQuery__
 *
 * To run a query within a React component, call `useRelayedVerificationCodesQuery` and pass it any options that fit your needs.
 * When your component renders, `useRelayedVerificationCodesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRelayedVerificationCodesQuery({
 *   variables: {
 *   },
 * });
 */
export function useRelayedVerificationCodesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<RelayedVerificationCodesQuery, RelayedVerificationCodesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<RelayedVerificationCodesQuery, RelayedVerificationCodesQueryVariables>(RelayedVerificationCodesDocument, options);
      }
export function useRelayedVerificationCodesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<RelayedVerificationCodesQuery, RelayedVerificationCodesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<RelayedVerificationCodesQuery, RelayedVerificationCodesQueryVariables>(RelayedVerificationCodesDocument, options);
        }
// @ts-ignore
export function useRelayedVerificationCodesSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<RelayedVerificationCodesQuery, RelayedVerificationCodesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<RelayedVerificationCodesQuery, RelayedVerificationCodesQueryVariables>;
// @ts-ignore
export function useRelayedVerificationCodesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<RelayedVerificationCodesQuery, RelayedVerificationCodesQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<RelayedVerificationCodesQuery | undefined, RelayedVerificationCodesQueryVariables>;
export function useRelayedVerificationCodesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<RelayedVerificationCodesQuery, RelayedVerificationCodesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<RelayedVerificationCodesQuery, RelayedVerificationCodesQueryVariables>(RelayedVerificationCodesDocument, options);
        }
export type RelayedVerificationCodesQueryHookResult = ReturnType<typeof useRelayedVerificationCodesQuery>;
export type RelayedVerificationCodesLazyQueryHookResult = ReturnType<typeof useRelayedVerificationCodesLazyQuery>;
export type RelayedVerificationCodesSuspenseQueryHookResult = ReturnType<typeof useRelayedVerificationCodesSuspenseQuery>;
export type RelayedVerificationCodesQueryResult = ApolloReactCommon.QueryResult<RelayedVerificationCodesQuery, RelayedVerificationCodesQueryVariables>;
