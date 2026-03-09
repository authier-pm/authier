import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type DeviceInfoQueryVariables = Types.Exact<{
  id: Types.Scalars['String']['input'];
}>;


export type DeviceInfoQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, masterDeviceId?: string | null, device: { __typename?: 'DeviceQuery', id: string, name: string, firstIpAddress: string, lastIpAddress: string, logoutAt?: string | null, lastGeoLocation: string, createdAt: string, lastSyncAt?: string | null, platform: string, syncTOTP: boolean, vaultLockTimeoutSeconds: number } } };


export const DeviceInfoDocument = gql`
    query deviceInfo($id: String!) {
  me {
    id
    masterDeviceId
    device(id: $id) {
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
 * __useDeviceInfoQuery__
 *
 * To run a query within a React component, call `useDeviceInfoQuery` and pass it any options that fit your needs.
 * When your component renders, `useDeviceInfoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDeviceInfoQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeviceInfoQuery(baseOptions: ApolloReactHooks.QueryHookOptions<DeviceInfoQuery, DeviceInfoQueryVariables> & ({ variables: DeviceInfoQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<DeviceInfoQuery, DeviceInfoQueryVariables>(DeviceInfoDocument, options);
      }
export function useDeviceInfoLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<DeviceInfoQuery, DeviceInfoQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<DeviceInfoQuery, DeviceInfoQueryVariables>(DeviceInfoDocument, options);
        }
// @ts-ignore
export function useDeviceInfoSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<DeviceInfoQuery, DeviceInfoQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DeviceInfoQuery, DeviceInfoQueryVariables>;
// @ts-ignore
export function useDeviceInfoSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DeviceInfoQuery, DeviceInfoQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DeviceInfoQuery | undefined, DeviceInfoQueryVariables>;
export function useDeviceInfoSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DeviceInfoQuery, DeviceInfoQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          // @ts-ignore
          return ApolloReactHooks.useSuspenseQuery<DeviceInfoQuery, DeviceInfoQueryVariables>(DeviceInfoDocument, options);
        }
export type DeviceInfoQueryHookResult = ReturnType<typeof useDeviceInfoQuery>;
export type DeviceInfoLazyQueryHookResult = ReturnType<typeof useDeviceInfoLazyQuery>;
export type DeviceInfoSuspenseQueryHookResult = ReturnType<typeof useDeviceInfoSuspenseQuery>;
export type DeviceInfoQueryResult = ApolloReactCommon.QueryResult<DeviceInfoQuery, DeviceInfoQueryVariables>;