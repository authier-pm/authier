/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type DefaultSettingsInput = {
  autofillTOTPEnabled: boolean;
  syncTOTP: boolean;
  theme: string;
  uiLanguage: string;
  vaultLockTimeoutSeconds: number;
};

export type UpdateDefaultDeviceSettingsMutationVariables = Exact<{
  config: Types.DefaultSettingsInput;
}>;


export type UpdateDefaultDeviceSettingsMutation = { me: { defaultDeviceSettings: { id: number, update: { id: number, autofillTOTPEnabled: boolean, theme: string, syncTOTP: boolean, vaultLockTimeoutSeconds: number } } } };

export type UpdateMasterDeviceResetTimeoutMutationVariables = Exact<{
  deviceRecoveryCooldownMinutes: number;
}>;


export type UpdateMasterDeviceResetTimeoutMutation = { me: { setDeviceRecoveryCooldownMinutes: { id: string, deviceRecoveryCooldownMinutes: number } } };

export type DefaultSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type DefaultSettingsQuery = { me: { id: string, masterDeviceId: string | null, uiLanguage: string, deviceRecoveryCooldownMinutes: number, masterDeviceResetConfig: unknown, defaultDeviceSettings: { id: number, autofillTOTPEnabled: boolean, syncTOTP: boolean, vaultLockTimeoutSeconds: number, theme: string } } };

export type UpdateMasterDeviceResetConfigMutationVariables = Exact<{
  config: unknown;
}>;


export type UpdateMasterDeviceResetConfigMutation = { me: { setMasterDeviceResetConfig: { id: string, masterDeviceResetConfig: unknown, deviceRecoveryCooldownMinutes: number } } };


export const UpdateDefaultDeviceSettingsDocument = gql`
    mutation updateDefaultDeviceSettings($config: DefaultSettingsInput!) {
  me {
    defaultDeviceSettings {
      id
      update(config: $config) {
        id
        autofillTOTPEnabled
        theme
        syncTOTP
        vaultLockTimeoutSeconds
      }
    }
  }
}
    `;

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
export function useUpdateDefaultDeviceSettingsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateDefaultDeviceSettingsMutation, UpdateDefaultDeviceSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateDefaultDeviceSettingsMutation, UpdateDefaultDeviceSettingsMutationVariables>(UpdateDefaultDeviceSettingsDocument, options);
      }
export type UpdateDefaultDeviceSettingsMutationHookResult = ReturnType<typeof useUpdateDefaultDeviceSettingsMutation>;
export type UpdateDefaultDeviceSettingsMutationResult = ApolloReactCommon.MutationResult<UpdateDefaultDeviceSettingsMutation>;
export const UpdateMasterDeviceResetTimeoutDocument = gql`
    mutation updateMasterDeviceResetTimeout($deviceRecoveryCooldownMinutes: NonNegativeInt!) {
  me {
    setDeviceRecoveryCooldownMinutes(
      deviceRecoveryCooldownMinutes: $deviceRecoveryCooldownMinutes
    ) {
      id
      deviceRecoveryCooldownMinutes
    }
  }
}
    `;

/**
 * __useUpdateMasterDeviceResetTimeoutMutation__
 *
 * To run a mutation, you first call `useUpdateMasterDeviceResetTimeoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMasterDeviceResetTimeoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMasterDeviceResetTimeoutMutation, { data, loading, error }] = useUpdateMasterDeviceResetTimeoutMutation({
 *   variables: {
 *      deviceRecoveryCooldownMinutes: // value for 'deviceRecoveryCooldownMinutes'
 *   },
 * });
 */
export function useUpdateMasterDeviceResetTimeoutMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateMasterDeviceResetTimeoutMutation, UpdateMasterDeviceResetTimeoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateMasterDeviceResetTimeoutMutation, UpdateMasterDeviceResetTimeoutMutationVariables>(UpdateMasterDeviceResetTimeoutDocument, options);
      }
export type UpdateMasterDeviceResetTimeoutMutationHookResult = ReturnType<typeof useUpdateMasterDeviceResetTimeoutMutation>;
export type UpdateMasterDeviceResetTimeoutMutationResult = ApolloReactCommon.MutationResult<UpdateMasterDeviceResetTimeoutMutation>;
export const DefaultSettingsDocument = gql`
    query defaultSettings {
  me {
    id
    masterDeviceId
    uiLanguage
    deviceRecoveryCooldownMinutes
    masterDeviceResetConfig
    defaultDeviceSettings {
      id
      autofillTOTPEnabled
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
export function useDefaultSettingsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<DefaultSettingsQuery, DefaultSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<DefaultSettingsQuery, DefaultSettingsQueryVariables>(DefaultSettingsDocument, options);
      }
export function useDefaultSettingsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<DefaultSettingsQuery, DefaultSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<DefaultSettingsQuery, DefaultSettingsQueryVariables>(DefaultSettingsDocument, options);
        }
// @ts-ignore
export function useDefaultSettingsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<DefaultSettingsQuery, DefaultSettingsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DefaultSettingsQuery, DefaultSettingsQueryVariables>;
// @ts-ignore
export function useDefaultSettingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DefaultSettingsQuery, DefaultSettingsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DefaultSettingsQuery | undefined, DefaultSettingsQueryVariables>;
export function useDefaultSettingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DefaultSettingsQuery, DefaultSettingsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<DefaultSettingsQuery, DefaultSettingsQueryVariables>(DefaultSettingsDocument, options);
        }
export type DefaultSettingsQueryHookResult = ReturnType<typeof useDefaultSettingsQuery>;
export type DefaultSettingsLazyQueryHookResult = ReturnType<typeof useDefaultSettingsLazyQuery>;
export type DefaultSettingsSuspenseQueryHookResult = ReturnType<typeof useDefaultSettingsSuspenseQuery>;
export type DefaultSettingsQueryResult = ApolloReactCommon.QueryResult<DefaultSettingsQuery, DefaultSettingsQueryVariables>;
export const UpdateMasterDeviceResetConfigDocument = gql`
    mutation updateMasterDeviceResetConfig($config: JSON!) {
  me {
    setMasterDeviceResetConfig(config: $config) {
      id
      masterDeviceResetConfig
      deviceRecoveryCooldownMinutes
    }
  }
}
    `;

/**
 * __useUpdateMasterDeviceResetConfigMutation__
 *
 * To run a mutation, you first call `useUpdateMasterDeviceResetConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMasterDeviceResetConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMasterDeviceResetConfigMutation, { data, loading, error }] = useUpdateMasterDeviceResetConfigMutation({
 *   variables: {
 *      config: // value for 'config'
 *   },
 * });
 */
export function useUpdateMasterDeviceResetConfigMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateMasterDeviceResetConfigMutation, UpdateMasterDeviceResetConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateMasterDeviceResetConfigMutation, UpdateMasterDeviceResetConfigMutationVariables>(UpdateMasterDeviceResetConfigDocument, options);
      }
export type UpdateMasterDeviceResetConfigMutationHookResult = ReturnType<typeof useUpdateMasterDeviceResetConfigMutation>;
export type UpdateMasterDeviceResetConfigMutationResult = ApolloReactCommon.MutationResult<UpdateMasterDeviceResetConfigMutation>;