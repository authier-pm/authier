import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type IsLoggedInQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type IsLoggedInQuery = { __typename?: 'Query', authenticated: boolean };

export type LogoutMutationVariables = Types.Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', currentDevice: { __typename?: 'DeviceMutation', logout: { __typename?: 'DeviceGQL', logoutAt?: string | null } } };


export const IsLoggedInDocument = gql`
    query isLoggedIn {
  authenticated
}
    `;

/**
 * __useIsLoggedInQuery__
 *
 * To run a query within a React component, call `useIsLoggedInQuery` and pass it any options that fit your needs.
 * When your component renders, `useIsLoggedInQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useIsLoggedInQuery({
 *   variables: {
 *   },
 * });
 */
export function useIsLoggedInQuery(baseOptions?: Apollo.QueryHookOptions<IsLoggedInQuery, IsLoggedInQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<IsLoggedInQuery, IsLoggedInQueryVariables>(IsLoggedInDocument, options);
      }
export function useIsLoggedInLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IsLoggedInQuery, IsLoggedInQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<IsLoggedInQuery, IsLoggedInQueryVariables>(IsLoggedInDocument, options);
        }
export function useIsLoggedInSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<IsLoggedInQuery, IsLoggedInQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<IsLoggedInQuery, IsLoggedInQueryVariables>(IsLoggedInDocument, options);
        }
export type IsLoggedInQueryHookResult = ReturnType<typeof useIsLoggedInQuery>;
export type IsLoggedInLazyQueryHookResult = ReturnType<typeof useIsLoggedInLazyQuery>;
export type IsLoggedInSuspenseQueryHookResult = ReturnType<typeof useIsLoggedInSuspenseQuery>;
export type IsLoggedInQueryResult = Apollo.QueryResult<IsLoggedInQuery, IsLoggedInQueryVariables>;
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