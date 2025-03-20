import * as Types from '../../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type DevicesListQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type DevicesListQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, masterDeviceId?: string | null, devices: Array<{ __typename?: 'DeviceQuery', id: string, name: string, lastIpAddress: string, logoutAt?: string | null, platform: string, lastGeoLocation: string }> } };


export const DevicesListDocument = gql`
    query devicesList {
  me {
    id
    masterDeviceId
    devices {
      id
      name
      lastIpAddress
      logoutAt
      platform
      lastGeoLocation
    }
  }
}
    `;

/**
 * __useDevicesListQuery__
 *
 * To run a query within a React component, call `useDevicesListQuery` and pass it any options that fit your needs.
 * When your component renders, `useDevicesListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDevicesListQuery({
 *   variables: {
 *   },
 * });
 */
export function useDevicesListQuery(baseOptions?: Apollo.QueryHookOptions<DevicesListQuery, DevicesListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DevicesListQuery, DevicesListQueryVariables>(DevicesListDocument, options);
      }
export function useDevicesListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DevicesListQuery, DevicesListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DevicesListQuery, DevicesListQueryVariables>(DevicesListDocument, options);
        }
export function useDevicesListSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DevicesListQuery, DevicesListQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DevicesListQuery, DevicesListQueryVariables>(DevicesListDocument, options);
        }
export type DevicesListQueryHookResult = ReturnType<typeof useDevicesListQuery>;
export type DevicesListLazyQueryHookResult = ReturnType<typeof useDevicesListLazyQuery>;
export type DevicesListSuspenseQueryHookResult = ReturnType<typeof useDevicesListSuspenseQuery>;
export type DevicesListQueryResult = Apollo.QueryResult<DevicesListQuery, DevicesListQueryVariables>;