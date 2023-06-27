import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type DefaultDeviceSettingsModalQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type DefaultDeviceSettingsModalQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, devicesCount: number, defaultDeviceSettings: { __typename?: 'DefaultDeviceSettingsQuery', id?: number | null } } };


export const DefaultDeviceSettingsModalDocument = gql`
    query DefaultDeviceSettingsModal {
  me {
    id
    defaultDeviceSettings {
      id
    }
    devicesCount
  }
}
    `;

/**
 * __useDefaultDeviceSettingsModalQuery__
 *
 * To run a query within a React component, call `useDefaultDeviceSettingsModalQuery` and pass it any options that fit your needs.
 * When your component renders, `useDefaultDeviceSettingsModalQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDefaultDeviceSettingsModalQuery({
 *   variables: {
 *   },
 * });
 */
export function useDefaultDeviceSettingsModalQuery(baseOptions?: Apollo.QueryHookOptions<DefaultDeviceSettingsModalQuery, DefaultDeviceSettingsModalQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DefaultDeviceSettingsModalQuery, DefaultDeviceSettingsModalQueryVariables>(DefaultDeviceSettingsModalDocument, options);
      }
export function useDefaultDeviceSettingsModalLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DefaultDeviceSettingsModalQuery, DefaultDeviceSettingsModalQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DefaultDeviceSettingsModalQuery, DefaultDeviceSettingsModalQueryVariables>(DefaultDeviceSettingsModalDocument, options);
        }
export type DefaultDeviceSettingsModalQueryHookResult = ReturnType<typeof useDefaultDeviceSettingsModalQuery>;
export type DefaultDeviceSettingsModalLazyQueryHookResult = ReturnType<typeof useDefaultDeviceSettingsModalLazyQuery>;
export type DefaultDeviceSettingsModalQueryResult = Apollo.QueryResult<DefaultDeviceSettingsModalQuery, DefaultDeviceSettingsModalQueryVariables>;