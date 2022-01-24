import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type MasterDeviceIdQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type MasterDeviceIdQuery = { __typename?: 'Query', me?: { __typename?: 'UserQuery', id: string, masterDeviceId?: string | null | undefined } | null | undefined };


export const MasterDeviceIdDocument = gql`
    query MasterDeviceId {
  me {
    id
    masterDeviceId
  }
}
    `;

/**
 * __useMasterDeviceIdQuery__
 *
 * To run a query within a React component, call `useMasterDeviceIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useMasterDeviceIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMasterDeviceIdQuery({
 *   variables: {
 *   },
 * });
 */
export function useMasterDeviceIdQuery(baseOptions?: Apollo.QueryHookOptions<MasterDeviceIdQuery, MasterDeviceIdQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MasterDeviceIdQuery, MasterDeviceIdQueryVariables>(MasterDeviceIdDocument, options);
      }
export function useMasterDeviceIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MasterDeviceIdQuery, MasterDeviceIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MasterDeviceIdQuery, MasterDeviceIdQueryVariables>(MasterDeviceIdDocument, options);
        }
export type MasterDeviceIdQueryHookResult = ReturnType<typeof useMasterDeviceIdQuery>;
export type MasterDeviceIdLazyQueryHookResult = ReturnType<typeof useMasterDeviceIdLazyQuery>;
export type MasterDeviceIdQueryResult = Apollo.QueryResult<MasterDeviceIdQuery, MasterDeviceIdQueryVariables>;