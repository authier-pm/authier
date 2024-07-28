import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type DevicesListWithDataQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type DevicesListWithDataQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, masterDeviceId?: string | null, devices: Array<{ __typename?: 'DeviceQuery', id: string, name: string, firstIpAddress: string, lastIpAddress: string, logoutAt?: any | null, lastGeoLocation: string, createdAt: any, lastSyncAt?: any | null, platform: string, syncTOTP: boolean, vaultLockTimeoutSeconds: number }> } };


export const DevicesListWithDataDocument = gql`
    query devicesListWithData {
  me {
    id
    masterDeviceId
    devices {
      id
      name
      firstIpAddress
      lastIpAddress
      logoutAt
      lastGeoLocation
      createdAt
      lastSyncAt
      platform
      createdAt
      syncTOTP
      vaultLockTimeoutSeconds
    }
  }
}
    `;

/**
 * __useDevicesListWithDataQuery__
 *
 * To run a query within a React component, call `useDevicesListWithDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useDevicesListWithDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDevicesListWithDataQuery({
 *   variables: {
 *   },
 * });
 */
export function useDevicesListWithDataQuery(baseOptions?: Apollo.QueryHookOptions<DevicesListWithDataQuery, DevicesListWithDataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DevicesListWithDataQuery, DevicesListWithDataQueryVariables>(DevicesListWithDataDocument, options);
      }
export function useDevicesListWithDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DevicesListWithDataQuery, DevicesListWithDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DevicesListWithDataQuery, DevicesListWithDataQueryVariables>(DevicesListWithDataDocument, options);
        }
export function useDevicesListWithDataSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<DevicesListWithDataQuery, DevicesListWithDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DevicesListWithDataQuery, DevicesListWithDataQueryVariables>(DevicesListWithDataDocument, options);
        }
export type DevicesListWithDataQueryHookResult = ReturnType<typeof useDevicesListWithDataQuery>;
export type DevicesListWithDataLazyQueryHookResult = ReturnType<typeof useDevicesListWithDataLazyQuery>;
export type DevicesListWithDataSuspenseQueryHookResult = ReturnType<typeof useDevicesListWithDataSuspenseQuery>;
export type DevicesListWithDataQueryResult = Apollo.QueryResult<DevicesListWithDataQuery, DevicesListWithDataQueryVariables>;