import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type DevicesRequestsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type DevicesRequestsQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, masterDeviceId?: string | null, decryptionChallengesWaiting: Array<{ __typename?: 'DecryptionChallengeForApproval', id: number, createdAt: string, deviceName: string, deviceId: any }> } };

export type ChangeMasterDeviceMutationVariables = Types.Exact<{
  newMasterDeviceId: Types.Scalars['String'];
}>;


export type ChangeMasterDeviceMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', setMasterDevice: { __typename?: 'MasterDeviceChangeGQL', id: string } } };

export type ApproveChallengeMutationVariables = Types.Exact<{
  id: Types.Scalars['Int'];
}>;


export type ApproveChallengeMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', id: string, decryptionChallenge: { __typename?: 'DecryptionChallengeMutation', approve: { __typename?: 'DecryptionChallengeGQL', id: number } } } };

export type RejectChallengeMutationVariables = Types.Exact<{
  id: Types.Scalars['Int'];
}>;


export type RejectChallengeMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', id: string, decryptionChallenge: { __typename?: 'DecryptionChallengeMutation', reject: { __typename?: 'DecryptionChallengeGQL', id: number } } } };


export const DevicesRequestsDocument = gql`
    query DevicesRequests {
  me {
    id
    masterDeviceId
    decryptionChallengesWaiting {
      id
      createdAt
      deviceName
      deviceId
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
export function useDevicesRequestsQuery(baseOptions?: Apollo.QueryHookOptions<DevicesRequestsQuery, DevicesRequestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DevicesRequestsQuery, DevicesRequestsQueryVariables>(DevicesRequestsDocument, options);
      }
export function useDevicesRequestsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DevicesRequestsQuery, DevicesRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DevicesRequestsQuery, DevicesRequestsQueryVariables>(DevicesRequestsDocument, options);
        }
export type DevicesRequestsQueryHookResult = ReturnType<typeof useDevicesRequestsQuery>;
export type DevicesRequestsLazyQueryHookResult = ReturnType<typeof useDevicesRequestsLazyQuery>;
export type DevicesRequestsQueryResult = Apollo.QueryResult<DevicesRequestsQuery, DevicesRequestsQueryVariables>;
export const ChangeMasterDeviceDocument = gql`
    mutation ChangeMasterDevice($newMasterDeviceId: String!) {
  me {
    setMasterDevice(newMasterDeviceId: $newMasterDeviceId) {
      id
    }
  }
}
    `;
export type ChangeMasterDeviceMutationFn = Apollo.MutationFunction<ChangeMasterDeviceMutation, ChangeMasterDeviceMutationVariables>;

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
export function useChangeMasterDeviceMutation(baseOptions?: Apollo.MutationHookOptions<ChangeMasterDeviceMutation, ChangeMasterDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ChangeMasterDeviceMutation, ChangeMasterDeviceMutationVariables>(ChangeMasterDeviceDocument, options);
      }
export type ChangeMasterDeviceMutationHookResult = ReturnType<typeof useChangeMasterDeviceMutation>;
export type ChangeMasterDeviceMutationResult = Apollo.MutationResult<ChangeMasterDeviceMutation>;
export type ChangeMasterDeviceMutationOptions = Apollo.BaseMutationOptions<ChangeMasterDeviceMutation, ChangeMasterDeviceMutationVariables>;
export const ApproveChallengeDocument = gql`
    mutation ApproveChallenge($id: Int!) {
  me {
    id
    decryptionChallenge(id: $id) {
      approve {
        id
      }
    }
  }
}
    `;
export type ApproveChallengeMutationFn = Apollo.MutationFunction<ApproveChallengeMutation, ApproveChallengeMutationVariables>;

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
export function useApproveChallengeMutation(baseOptions?: Apollo.MutationHookOptions<ApproveChallengeMutation, ApproveChallengeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ApproveChallengeMutation, ApproveChallengeMutationVariables>(ApproveChallengeDocument, options);
      }
export type ApproveChallengeMutationHookResult = ReturnType<typeof useApproveChallengeMutation>;
export type ApproveChallengeMutationResult = Apollo.MutationResult<ApproveChallengeMutation>;
export type ApproveChallengeMutationOptions = Apollo.BaseMutationOptions<ApproveChallengeMutation, ApproveChallengeMutationVariables>;
export const RejectChallengeDocument = gql`
    mutation RejectChallenge($id: Int!) {
  me {
    id
    decryptionChallenge(id: $id) {
      reject {
        id
      }
    }
  }
}
    `;
export type RejectChallengeMutationFn = Apollo.MutationFunction<RejectChallengeMutation, RejectChallengeMutationVariables>;

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
export function useRejectChallengeMutation(baseOptions?: Apollo.MutationHookOptions<RejectChallengeMutation, RejectChallengeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RejectChallengeMutation, RejectChallengeMutationVariables>(RejectChallengeDocument, options);
      }
export type RejectChallengeMutationHookResult = ReturnType<typeof useRejectChallengeMutation>;
export type RejectChallengeMutationResult = Apollo.MutationResult<RejectChallengeMutation>;
export type RejectChallengeMutationOptions = Apollo.BaseMutationOptions<RejectChallengeMutation, RejectChallengeMutationVariables>;