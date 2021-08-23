import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type DeviceCountQueryVariables = Types.Exact<{
  userId: Types.Scalars['String'];
}>;


export type DeviceCountQuery = { __typename?: 'Query', user: { __typename?: 'UserQuery', devicesCount: number } };


export const DeviceCountDocument = gql`
    query DeviceCount($userId: String!) {
  user(userId: $userId) {
    devicesCount
  }
}
    `;

/**
 * __useDeviceCountQuery__
 *
 * To run a query within a React component, call `useDeviceCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useDeviceCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDeviceCountQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useDeviceCountQuery(baseOptions: Apollo.QueryHookOptions<DeviceCountQuery, DeviceCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DeviceCountQuery, DeviceCountQueryVariables>(DeviceCountDocument, options);
      }
export function useDeviceCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DeviceCountQuery, DeviceCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DeviceCountQuery, DeviceCountQueryVariables>(DeviceCountDocument, options);
        }
export type DeviceCountQueryHookResult = ReturnType<typeof useDeviceCountQuery>;
export type DeviceCountLazyQueryHookResult = ReturnType<typeof useDeviceCountLazyQuery>;
export type DeviceCountQueryResult = Apollo.QueryResult<DeviceCountQuery, DeviceCountQueryVariables>;