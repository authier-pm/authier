import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type UserNewDevicePolicyQueryQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type UserNewDevicePolicyQueryQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, newDevicePolicy?: Types.UserNewDevicePolicy | null, masterDeviceId?: string | null } };


export const UserNewDevicePolicyQueryDocument = gql`
    query UserNewDevicePolicyQuery {
  me {
    id
    newDevicePolicy
    masterDeviceId
  }
}
    `;

/**
 * __useUserNewDevicePolicyQueryQuery__
 *
 * To run a query within a React component, call `useUserNewDevicePolicyQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserNewDevicePolicyQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserNewDevicePolicyQueryQuery({
 *   variables: {
 *   },
 * });
 */
export function useUserNewDevicePolicyQueryQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>(UserNewDevicePolicyQueryDocument, options);
      }
export function useUserNewDevicePolicyQueryLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>(UserNewDevicePolicyQueryDocument, options);
        }
// @ts-ignore
export function useUserNewDevicePolicyQuerySuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>;
// @ts-ignore
export function useUserNewDevicePolicyQuerySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<UserNewDevicePolicyQueryQuery | undefined, UserNewDevicePolicyQueryQueryVariables>;
export function useUserNewDevicePolicyQuerySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>(UserNewDevicePolicyQueryDocument, options);
        }
export type UserNewDevicePolicyQueryQueryHookResult = ReturnType<typeof useUserNewDevicePolicyQueryQuery>;
export type UserNewDevicePolicyQueryLazyQueryHookResult = ReturnType<typeof useUserNewDevicePolicyQueryLazyQuery>;
export type UserNewDevicePolicyQuerySuspenseQueryHookResult = ReturnType<typeof useUserNewDevicePolicyQuerySuspenseQuery>;
export type UserNewDevicePolicyQueryQueryResult = ApolloReactCommon.QueryResult<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>;