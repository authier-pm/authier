import * as Types from '../../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UpdateDefaultDeviceSettingsMutationVariables = Types.Exact<{
  config: Types.DefaultSettingsInput;
}>;


export type UpdateDefaultDeviceSettingsMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', defaultDeviceSettings: { __typename?: 'DefaultDeviceSettingsMutation', id: number, update: { __typename?: 'DefaultDeviceSettingsGQLScalars', id: number, autofillTOTPEnabled: boolean, autofillCredentialsEnabled: boolean, theme: string, syncTOTP: boolean, vaultLockTimeoutSeconds: number } } } };

export type DefaultSettingsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type DefaultSettingsQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, masterDeviceId?: string | null, uiLanguage: string, defaultDeviceSettings: { __typename?: 'DefaultDeviceSettingsQuery', id: number, autofillTOTPEnabled: boolean, autofillCredentialsEnabled: boolean, syncTOTP: boolean, vaultLockTimeoutSeconds: number, theme: string } } };


export const UpdateDefaultDeviceSettingsDocument = gql`
    mutation updateDefaultDeviceSettings($config: DefaultSettingsInput!) {
  me {
    defaultDeviceSettings {
      id
      update(config: $config) {
        id
        autofillTOTPEnabled
        autofillCredentialsEnabled
        theme
        syncTOTP
        vaultLockTimeoutSeconds
      }
    }
  }
}
    `;
export type UpdateDefaultDeviceSettingsMutationFn = Apollo.MutationFunction<UpdateDefaultDeviceSettingsMutation, UpdateDefaultDeviceSettingsMutationVariables>;

/**
 * __useUpdateDefaultDeviceSettingsMutation__
 *
 * To run a mutation, you first call `useUpdateDefaultDeviceSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateDefaultDeviceSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateDefaultDeviceSettingsMutation, { data, loading, error }] = useUpdateDefaultDeviceSettingsMutation({
 *   variables: {
 *      config: // value for 'config'
 *   },
 * });
 */
export function useUpdateDefaultDeviceSettingsMutation(baseOptions?: Apollo.MutationHookOptions<UpdateDefaultDeviceSettingsMutation, UpdateDefaultDeviceSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateDefaultDeviceSettingsMutation, UpdateDefaultDeviceSettingsMutationVariables>(UpdateDefaultDeviceSettingsDocument, options);
      }
export type UpdateDefaultDeviceSettingsMutationHookResult = ReturnType<typeof useUpdateDefaultDeviceSettingsMutation>;
export type UpdateDefaultDeviceSettingsMutationResult = Apollo.MutationResult<UpdateDefaultDeviceSettingsMutation>;
export type UpdateDefaultDeviceSettingsMutationOptions = Apollo.BaseMutationOptions<UpdateDefaultDeviceSettingsMutation, UpdateDefaultDeviceSettingsMutationVariables>;
export const DefaultSettingsDocument = gql`
    query defaultSettings {
  me {
    id
    masterDeviceId
    uiLanguage
    defaultDeviceSettings {
      id
      autofillTOTPEnabled
      autofillCredentialsEnabled
      syncTOTP
      vaultLockTimeoutSeconds
      theme
    }
  }
}
    `;

/**
 * __useDefaultSettingsQuery__
 *
 * To run a query within a React component, call `useDefaultSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useDefaultSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDefaultSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useDefaultSettingsQuery(baseOptions?: Apollo.QueryHookOptions<DefaultSettingsQuery, DefaultSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DefaultSettingsQuery, DefaultSettingsQueryVariables>(DefaultSettingsDocument, options);
      }
export function useDefaultSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DefaultSettingsQuery, DefaultSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DefaultSettingsQuery, DefaultSettingsQueryVariables>(DefaultSettingsDocument, options);
        }
export function useDefaultSettingsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DefaultSettingsQuery, DefaultSettingsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DefaultSettingsQuery, DefaultSettingsQueryVariables>(DefaultSettingsDocument, options);
        }
export type DefaultSettingsQueryHookResult = ReturnType<typeof useDefaultSettingsQuery>;
export type DefaultSettingsLazyQueryHookResult = ReturnType<typeof useDefaultSettingsLazyQuery>;
export type DefaultSettingsSuspenseQueryHookResult = ReturnType<typeof useDefaultSettingsSuspenseQuery>;
export type DefaultSettingsQueryResult = Apollo.QueryResult<DefaultSettingsQuery, DefaultSettingsQueryVariables>;