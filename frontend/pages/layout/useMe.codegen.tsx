import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type UseMeQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type UseMeQuery = { __typename?: 'Query', me?: { __typename?: 'UserQuery', id: string, email?: string | null | undefined } | null | undefined };


export const UseMeDocument = gql`
    query useMe {
  me {
    id
    email
  }
}
    `;

/**
 * __useUseMeQuery__
 *
 * To run a query within a React component, call `useUseMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useUseMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUseMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useUseMeQuery(baseOptions?: Apollo.QueryHookOptions<UseMeQuery, UseMeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UseMeQuery, UseMeQueryVariables>(UseMeDocument, options);
      }
export function useUseMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UseMeQuery, UseMeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UseMeQuery, UseMeQueryVariables>(UseMeDocument, options);
        }
export type UseMeQueryHookResult = ReturnType<typeof useUseMeQuery>;
export type UseMeLazyQueryHookResult = ReturnType<typeof useUseMeLazyQuery>;
export type UseMeQueryResult = Apollo.QueryResult<UseMeQuery, UseMeQueryVariables>;