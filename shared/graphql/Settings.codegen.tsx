import * as Types from '../generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type SyncSettingsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type SyncSettingsQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', loginCredentialsLimit: number, TOTPlimit: number, id: string, autofill: boolean, language: string, theme: string }, currentDevice: { __typename?: 'DeviceQuery', id: string, syncTOTP: boolean, vaultLockTimeoutSeconds?: number | null } };

export type UpdateSettingsMutationVariables = Types.Exact<{
  config: Types.SettingsInput;
}>;


export type UpdateSettingsMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', updateSettings: { __typename?: 'UserGQL', id: string } } };


export const SyncSettingsDocument = gql`
    query SyncSettings {
  me {
    loginCredentialsLimit
    TOTPlimit
    id
    autofill
    language
    theme
  }
  currentDevice {
    id
    syncTOTP
    vaultLockTimeoutSeconds
  }
}
    `;

/**
 * __useSyncSettingsQuery__
 *
 * To run a query within a React component, call `useSyncSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSyncSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSyncSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSyncSettingsQuery(baseOptions?: Apollo.QueryHookOptions<SyncSettingsQuery, SyncSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SyncSettingsQuery, SyncSettingsQueryVariables>(SyncSettingsDocument, options);
      }
export function useSyncSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SyncSettingsQuery, SyncSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SyncSettingsQuery, SyncSettingsQueryVariables>(SyncSettingsDocument, options);
        }
export type SyncSettingsQueryHookResult = ReturnType<typeof useSyncSettingsQuery>;
export type SyncSettingsLazyQueryHookResult = ReturnType<typeof useSyncSettingsLazyQuery>;
export type SyncSettingsQueryResult = Apollo.QueryResult<SyncSettingsQuery, SyncSettingsQueryVariables>;
export const UpdateSettingsDocument = gql`
    mutation updateSettings($config: SettingsInput!) {
  me {
    updateSettings(config: $config) {
      id
    }
  }
}
    `;
export type UpdateSettingsMutationFn = Apollo.MutationFunction<UpdateSettingsMutation, UpdateSettingsMutationVariables>;

/**
 * __useUpdateSettingsMutation__
 *
 * To run a mutation, you first call `useUpdateSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSettingsMutation, { data, loading, error }] = useUpdateSettingsMutation({
 *   variables: {
 *      config: // value for 'config'
 *   },
 * });
 */
export function useUpdateSettingsMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSettingsMutation, UpdateSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSettingsMutation, UpdateSettingsMutationVariables>(UpdateSettingsDocument, options);
      }
export type UpdateSettingsMutationHookResult = ReturnType<typeof useUpdateSettingsMutation>;
export type UpdateSettingsMutationResult = Apollo.MutationResult<UpdateSettingsMutation>;
export type UpdateSettingsMutationOptions = Apollo.BaseMutationOptions<UpdateSettingsMutation, UpdateSettingsMutationVariables>;