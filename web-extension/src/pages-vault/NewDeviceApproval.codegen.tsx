import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
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
export function useUserNewDevicePolicyQueryQuery(baseOptions?: Apollo.QueryHookOptions<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>(UserNewDevicePolicyQueryDocument, options);
      }
export function useUserNewDevicePolicyQueryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>(UserNewDevicePolicyQueryDocument, options);
        }
export function useUserNewDevicePolicyQuerySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>(UserNewDevicePolicyQueryDocument, options);
        }
export type UserNewDevicePolicyQueryQueryHookResult = ReturnType<typeof useUserNewDevicePolicyQueryQuery>;
export type UserNewDevicePolicyQueryLazyQueryHookResult = ReturnType<typeof useUserNewDevicePolicyQueryLazyQuery>;
export type UserNewDevicePolicyQuerySuspenseQueryHookResult = ReturnType<typeof useUserNewDevicePolicyQuerySuspenseQuery>;
export type UserNewDevicePolicyQueryQueryResult = Apollo.QueryResult<UserNewDevicePolicyQueryQuery, UserNewDevicePolicyQueryQueryVariables>;