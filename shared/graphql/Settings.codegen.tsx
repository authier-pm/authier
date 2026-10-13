/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type SettingsInput = {
  autofillForbiddenUrlPatterns?: string | null | undefined;
  autofillTOTPEnabled: boolean;
  notificationOnVaultUnlock: boolean;
  notificationOnWrongPasswordAttempts: number;
  syncTOTP: boolean;
  uiLanguage: string;
  vaultLockTimeoutSeconds: number;
};

export type SyncSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type SyncSettingsQuery = { me: { id: string, loginCredentialsLimit: number, TOTPlimit: number, notificationOnVaultUnlock: boolean, notificationOnWrongPasswordAttempts: number, uiLanguage: string, autofillForbiddenUrlPatterns: string }, currentDevice: { id: string, syncTOTP: boolean, vaultLockTimeoutSeconds: number, autofillTOTPEnabled: boolean } };

export type UpdateSettingsMutationVariables = Exact<{
  config: Types.SettingsInput;
}>;


export type UpdateSettingsMutation = { me: { updateSettings: { id: string } } };


export const SyncSettingsDocument = gql`
    query SyncSettings {
  me {
    id
    loginCredentialsLimit
    TOTPlimit
    notificationOnVaultUnlock
    notificationOnWrongPasswordAttempts
    uiLanguage
    autofillForbiddenUrlPatterns
  }
  currentDevice {
    id
    syncTOTP
    vaultLockTimeoutSeconds
    autofillTOTPEnabled
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
export function useSyncSettingsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<SyncSettingsQuery, SyncSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SyncSettingsQuery, SyncSettingsQueryVariables>(SyncSettingsDocument, options);
      }
export function useSyncSettingsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SyncSettingsQuery, SyncSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SyncSettingsQuery, SyncSettingsQueryVariables>(SyncSettingsDocument, options);
        }
// @ts-ignore
export function useSyncSettingsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<SyncSettingsQuery, SyncSettingsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<SyncSettingsQuery, SyncSettingsQueryVariables>;
// @ts-ignore
export function useSyncSettingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SyncSettingsQuery, SyncSettingsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<SyncSettingsQuery | undefined, SyncSettingsQueryVariables>;
export function useSyncSettingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SyncSettingsQuery, SyncSettingsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<SyncSettingsQuery, SyncSettingsQueryVariables>(SyncSettingsDocument, options);
        }
export type SyncSettingsQueryHookResult = ReturnType<typeof useSyncSettingsQuery>;
export type SyncSettingsLazyQueryHookResult = ReturnType<typeof useSyncSettingsLazyQuery>;
export type SyncSettingsSuspenseQueryHookResult = ReturnType<typeof useSyncSettingsSuspenseQuery>;
export type SyncSettingsQueryResult = ApolloReactCommon.QueryResult<SyncSettingsQuery, SyncSettingsQueryVariables>;
export const UpdateSettingsDocument = gql`
    mutation updateSettings($config: SettingsInput!) {
  me {
    updateSettings(config: $config) {
      id
    }
  }
}
    `;

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
export function useUpdateSettingsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateSettingsMutation, UpdateSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateSettingsMutation, UpdateSettingsMutationVariables>(UpdateSettingsDocument, options);
      }
export type UpdateSettingsMutationHookResult = ReturnType<typeof useUpdateSettingsMutation>;
export type UpdateSettingsMutationResult = ApolloReactCommon.MutationResult<UpdateSettingsMutation>;