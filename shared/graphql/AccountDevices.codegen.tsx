import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type RejectChallengeMutationVariables = Types.Exact<{
  id: Types.Scalars['Int']['input'];
}>;


export type RejectChallengeMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', decryptionChallenge: { __typename?: 'DecryptionChallengeMutation', reject: { __typename?: 'DecryptionChallengeGQL', id: number } } } };

export type ApproveChallengeMutationVariables = Types.Exact<{
  id: Types.Scalars['Int']['input'];
}>;


export type ApproveChallengeMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', decryptionChallenge: { __typename?: 'DecryptionChallengeMutation', approve: { __typename?: 'DecryptionChallengeGQL', id: number } } } };

export type DevicesRequestsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type DevicesRequestsQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, masterDeviceId?: string | null, newDevicePolicy?: Types.UserNewDevicePolicy | null, decryptionChallengesWaiting: Array<{ __typename?: 'DecryptionChallengeForApproval', id: number, createdAt: string, deviceName: string, deviceId: string, ipAddress: string, ipGeoLocation?: any | null, pushNotificationsSentCount: number, pushNotificationsFailedCount: number, masterDeviceResetRequestedAt?: string | null, masterDeviceResetProcessAt?: string | null, masterDeviceResetConfirmedAt?: string | null, masterDeviceResetRejectedAt?: string | null }> } };

export type LogoutDeviceMutationVariables = Types.Exact<{
  id: Types.Scalars['String']['input'];
}>;


export type LogoutDeviceMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', device: { __typename?: 'DeviceMutation', logout: { __typename?: 'DeviceGQL', id: string } } } };

export type RemoveDeviceMutationVariables = Types.Exact<{
  id: Types.Scalars['String']['input'];
}>;


export type RemoveDeviceMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', device: { __typename?: 'DeviceMutation', removeDevice: boolean } } };

export type ChangeMasterDeviceMutationVariables = Types.Exact<{
  newMasterDeviceId: Types.Scalars['String']['input'];
}>;


export type ChangeMasterDeviceMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', setMasterDevice: { __typename?: 'MasterDeviceChangeGQL', id: string } } };

export type ChangeDeviceSettingsMutationVariables = Types.Exact<{
  id: Types.Scalars['String']['input'];
  syncTOTP: Types.Scalars['Boolean']['input'];
  vaultLockTimeoutSeconds: Types.Scalars['Int']['input'];
}>;


export type ChangeDeviceSettingsMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', device: { __typename?: 'DeviceMutation', updateDeviceSettings: { __typename?: 'DeviceGQL', id: string } } } };

export type RenameDeviceMutationVariables = Types.Exact<{
  id: Types.Scalars['String']['input'];
  name: Types.Scalars['String']['input'];
}>;


export type RenameDeviceMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', device: { __typename?: 'DeviceMutation', rename: { __typename?: 'DeviceGQL', id: string } } } };


export const RejectChallengeDocument = gql`
    mutation RejectChallenge($id: Int!) {
  me {
    decryptionChallenge(id: $id) {
      reject {
        id
      }
    }
  }
}
    `;

/**
 * __useRejectChallengeMutation__
 *
 * To run a mutation, you first call `useRejectChallengeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRejectChallengeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rejectChallengeMutation, { data, loading, error }] = useRejectChallengeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRejectChallengeMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RejectChallengeMutation, RejectChallengeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RejectChallengeMutation, RejectChallengeMutationVariables>(RejectChallengeDocument, options);
      }
export type RejectChallengeMutationHookResult = ReturnType<typeof useRejectChallengeMutation>;
export type RejectChallengeMutationResult = ApolloReactCommon.MutationResult<RejectChallengeMutation>;
export const ApproveChallengeDocument = gql`
    mutation ApproveChallenge($id: Int!) {
  me {
    decryptionChallenge(id: $id) {
      approve {
        id
      }
    }
  }
}
    `;

/**
 * __useApproveChallengeMutation__
 *
 * To run a mutation, you first call `useApproveChallengeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useApproveChallengeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [approveChallengeMutation, { data, loading, error }] = useApproveChallengeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApproveChallengeMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ApproveChallengeMutation, ApproveChallengeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ApproveChallengeMutation, ApproveChallengeMutationVariables>(ApproveChallengeDocument, options);
      }
export type ApproveChallengeMutationHookResult = ReturnType<typeof useApproveChallengeMutation>;
export type ApproveChallengeMutationResult = ApolloReactCommon.MutationResult<ApproveChallengeMutation>;
export const DevicesRequestsDocument = gql`
    query DevicesRequests {
  me {
    id
    masterDeviceId
    newDevicePolicy
    decryptionChallengesWaiting {
      id
      createdAt
      deviceName
      deviceId
      ipAddress
      ipGeoLocation
      pushNotificationsSentCount
      pushNotificationsFailedCount
      masterDeviceResetRequestedAt
      masterDeviceResetProcessAt
      masterDeviceResetConfirmedAt
      masterDeviceResetRejectedAt
    }
  }
}
    `;

/**
 * __useDevicesRequestsQuery__
 *
 * To run a query within a React component, call `useDevicesRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useDevicesRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDevicesRequestsQuery({
 *   variables: {
 *   },
 * });
 */
export function useDevicesRequestsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<DevicesRequestsQuery, DevicesRequestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<DevicesRequestsQuery, DevicesRequestsQueryVariables>(DevicesRequestsDocument, options);
      }
export function useDevicesRequestsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<DevicesRequestsQuery, DevicesRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<DevicesRequestsQuery, DevicesRequestsQueryVariables>(DevicesRequestsDocument, options);
        }
// @ts-ignore
export function useDevicesRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<DevicesRequestsQuery, DevicesRequestsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DevicesRequestsQuery, DevicesRequestsQueryVariables>;
// @ts-ignore
export function useDevicesRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DevicesRequestsQuery, DevicesRequestsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<DevicesRequestsQuery | undefined, DevicesRequestsQueryVariables>;
export function useDevicesRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<DevicesRequestsQuery, DevicesRequestsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<DevicesRequestsQuery, DevicesRequestsQueryVariables>(DevicesRequestsDocument, options);
        }
export type DevicesRequestsQueryHookResult = ReturnType<typeof useDevicesRequestsQuery>;
export type DevicesRequestsLazyQueryHookResult = ReturnType<typeof useDevicesRequestsLazyQuery>;
export type DevicesRequestsSuspenseQueryHookResult = ReturnType<typeof useDevicesRequestsSuspenseQuery>;
export type DevicesRequestsQueryResult = ApolloReactCommon.QueryResult<DevicesRequestsQuery, DevicesRequestsQueryVariables>;
export const LogoutDeviceDocument = gql`
    mutation logoutDevice($id: String!) {
  me {
    device(id: $id) {
      logout {
        id
      }
    }
  }
}
    `;

/**
 * __useLogoutDeviceMutation__
 *
 * To run a mutation, you first call `useLogoutDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutDeviceMutation, { data, loading, error }] = useLogoutDeviceMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useLogoutDeviceMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LogoutDeviceMutation, LogoutDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<LogoutDeviceMutation, LogoutDeviceMutationVariables>(LogoutDeviceDocument, options);
      }
export type LogoutDeviceMutationHookResult = ReturnType<typeof useLogoutDeviceMutation>;
export type LogoutDeviceMutationResult = ApolloReactCommon.MutationResult<LogoutDeviceMutation>;
export const RemoveDeviceDocument = gql`
    mutation removeDevice($id: String!) {
  me {
    device(id: $id) {
      removeDevice
    }
  }
}
    `;

/**
 * __useRemoveDeviceMutation__
 *
 * To run a mutation, you first call `useRemoveDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeDeviceMutation, { data, loading, error }] = useRemoveDeviceMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRemoveDeviceMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RemoveDeviceMutation, RemoveDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RemoveDeviceMutation, RemoveDeviceMutationVariables>(RemoveDeviceDocument, options);
      }
export type RemoveDeviceMutationHookResult = ReturnType<typeof useRemoveDeviceMutation>;
export type RemoveDeviceMutationResult = ApolloReactCommon.MutationResult<RemoveDeviceMutation>;
export const ChangeMasterDeviceDocument = gql`
    mutation ChangeMasterDevice($newMasterDeviceId: String!) {
  me {
    setMasterDevice(newMasterDeviceId: $newMasterDeviceId) {
      id
    }
  }
}
    `;

/**
 * __useChangeMasterDeviceMutation__
 *
 * To run a mutation, you first call `useChangeMasterDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangeMasterDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changeMasterDeviceMutation, { data, loading, error }] = useChangeMasterDeviceMutation({
 *   variables: {
 *      newMasterDeviceId: // value for 'newMasterDeviceId'
 *   },
 * });
 */
export function useChangeMasterDeviceMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ChangeMasterDeviceMutation, ChangeMasterDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ChangeMasterDeviceMutation, ChangeMasterDeviceMutationVariables>(ChangeMasterDeviceDocument, options);
      }
export type ChangeMasterDeviceMutationHookResult = ReturnType<typeof useChangeMasterDeviceMutation>;
export type ChangeMasterDeviceMutationResult = ApolloReactCommon.MutationResult<ChangeMasterDeviceMutation>;
export const ChangeDeviceSettingsDocument = gql`
    mutation changeDeviceSettings($id: String!, $syncTOTP: Boolean!, $vaultLockTimeoutSeconds: Int!) {
  me {
    device(id: $id) {
      updateDeviceSettings(
        syncTOTP: $syncTOTP
        vaultLockTimeoutSeconds: $vaultLockTimeoutSeconds
      ) {
        id
      }
    }
  }
}
    `;

/**
 * __useChangeDeviceSettingsMutation__
 *
 * To run a mutation, you first call `useChangeDeviceSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangeDeviceSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changeDeviceSettingsMutation, { data, loading, error }] = useChangeDeviceSettingsMutation({
 *   variables: {
 *      id: // value for 'id'
 *      syncTOTP: // value for 'syncTOTP'
 *      vaultLockTimeoutSeconds: // value for 'vaultLockTimeoutSeconds'
 *   },
 * });
 */
export function useChangeDeviceSettingsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ChangeDeviceSettingsMutation, ChangeDeviceSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ChangeDeviceSettingsMutation, ChangeDeviceSettingsMutationVariables>(ChangeDeviceSettingsDocument, options);
      }
export type ChangeDeviceSettingsMutationHookResult = ReturnType<typeof useChangeDeviceSettingsMutation>;
export type ChangeDeviceSettingsMutationResult = ApolloReactCommon.MutationResult<ChangeDeviceSettingsMutation>;
export const RenameDeviceDocument = gql`
    mutation renameDevice($id: String!, $name: String!) {
  me {
    device(id: $id) {
      rename(name: $name) {
        id
      }
    }
  }
}
    `;

/**
 * __useRenameDeviceMutation__
 *
 * To run a mutation, you first call `useRenameDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRenameDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [renameDeviceMutation, { data, loading, error }] = useRenameDeviceMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *   },
 * });
 */
export function useRenameDeviceMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RenameDeviceMutation, RenameDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RenameDeviceMutation, RenameDeviceMutationVariables>(RenameDeviceDocument, options);
      }
export type RenameDeviceMutationHookResult = ReturnType<typeof useRenameDeviceMutation>;
export type RenameDeviceMutationResult = ApolloReactCommon.MutationResult<RenameDeviceMutation>;