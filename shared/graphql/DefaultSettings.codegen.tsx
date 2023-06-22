import * as Types from '../generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UpdateDefaultSettingsMutationVariables = Types.Exact<{
  config: Types.DefaultSettingsInput;
}>;


export type UpdateDefaultSettingsMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', updateDefaultSettings: { __typename?: 'UserGQL', id: string } } };

export type SyncDefaultSettingsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type SyncDefaultSettingsQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, DefaultSettings: Array<{ __typename?: 'DefaultSettingsGQL', autofillTOTPEnabled: boolean, autofillCredentialsEnabled: boolean, uiLanguage: string, deviceTheme: string, deviceSyncTOTP: boolean, vaultLockTimeoutSeconds: number }> } };


export const UpdateDefaultSettingsDocument = gql`
    mutation updateDefaultSettings($config: DefaultSettingsInput!) {
  me {
    updateDefaultSettings(config: $config) {
      id
    }
  }
}
    `;
export type UpdateDefaultSettingsMutationFn = Apollo.MutationFunction<UpdateDefaultSettingsMutation, UpdateDefaultSettingsMutationVariables>;

/**
 * __useUpdateDefaultSettingsMutation__
 *
 * To run a mutation, you first call `useUpdateDefaultSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateDefaultSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateDefaultSettingsMutation, { data, loading, error }] = useUpdateDefaultSettingsMutation({
 *   variables: {
 *      config: // value for 'config'
 *   },
 * });
 */
export function useUpdateDefaultSettingsMutation(baseOptions?: Apollo.MutationHookOptions<UpdateDefaultSettingsMutation, UpdateDefaultSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateDefaultSettingsMutation, UpdateDefaultSettingsMutationVariables>(UpdateDefaultSettingsDocument, options);
      }
export type UpdateDefaultSettingsMutationHookResult = ReturnType<typeof useUpdateDefaultSettingsMutation>;
export type UpdateDefaultSettingsMutationResult = Apollo.MutationResult<UpdateDefaultSettingsMutation>;
export type UpdateDefaultSettingsMutationOptions = Apollo.BaseMutationOptions<UpdateDefaultSettingsMutation, UpdateDefaultSettingsMutationVariables>;
export const SyncDefaultSettingsDocument = gql`
    query syncDefaultSettings {
  me {
    id
    DefaultSettings {
      autofillTOTPEnabled
      autofillCredentialsEnabled
      uiLanguage
      deviceTheme
      deviceSyncTOTP
      vaultLockTimeoutSeconds
    }
  }
}
    `;

/**
 * __useSyncDefaultSettingsQuery__
 *
 * To run a query within a React component, call `useSyncDefaultSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSyncDefaultSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSyncDefaultSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSyncDefaultSettingsQuery(baseOptions?: Apollo.QueryHookOptions<SyncDefaultSettingsQuery, SyncDefaultSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SyncDefaultSettingsQuery, SyncDefaultSettingsQueryVariables>(SyncDefaultSettingsDocument, options);
      }
export function useSyncDefaultSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SyncDefaultSettingsQuery, SyncDefaultSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SyncDefaultSettingsQuery, SyncDefaultSettingsQueryVariables>(SyncDefaultSettingsDocument, options);
        }
export type SyncDefaultSettingsQueryHookResult = ReturnType<typeof useSyncDefaultSettingsQuery>;
export type SyncDefaultSettingsLazyQueryHookResult = ReturnType<typeof useSyncDefaultSettingsLazyQuery>;
export type SyncDefaultSettingsQueryResult = Apollo.QueryResult<SyncDefaultSettingsQuery, SyncDefaultSettingsQueryVariables>;