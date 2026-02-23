import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
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
export function useDevicesListQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<DevicesListQuery, DevicesListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<DevicesListQuery, DevicesListQueryVariables>(DevicesListDocument, options);
      }
export function useDevicesListLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<DevicesListQuery, DevicesListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<DevicesListQuery, DevicesListQueryVariables>(DevicesListDocument, options);
        }
// @ts-ignore
export function useDevicesListSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<DevicesListQuery, DevicesListQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DevicesListQuery, DevicesListQueryVariables>;
// @ts-ignore
export function useDevicesListSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DevicesListQuery, DevicesListQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DevicesListQuery | undefined, DevicesListQueryVariables>;
export function useDevicesListSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DevicesListQuery, DevicesListQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<DevicesListQuery, DevicesListQueryVariables>(DevicesListDocument, options);
        }
export type DevicesListQueryHookResult = ReturnType<typeof useDevicesListQuery>;
export type DevicesListLazyQueryHookResult = ReturnType<typeof useDevicesListLazyQuery>;
export type DevicesListSuspenseQueryHookResult = ReturnType<typeof useDevicesListSuspenseQuery>;
export type DevicesListQueryResult = ApolloReactCommon.QueryResult<DevicesListQuery, DevicesListQueryVariables>;