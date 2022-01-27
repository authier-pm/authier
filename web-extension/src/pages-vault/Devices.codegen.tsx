import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type DevicesPageQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type DevicesPageQuery = { __typename?: 'Query', me?: { __typename?: 'UserQuery', id: string, masterDeviceId?: string | null | undefined, decryptionChallengesWaiting: Array<{ __typename?: 'DecryptionChallengeForApproval', id: number, createdAt: string, deviceName: string, deviceId: string }> } | null | undefined };

export type ApproveChallengeMutationVariables = Types.Exact<{
  id: Types.Scalars['Int'];
}>;


export type ApproveChallengeMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', decryptionChallenge: { __typename?: 'DecryptionChallengeMutation', approve: { __typename?: 'DecryptionChallengeGQL', id: number } } } };

export type RejectChallengeMutationVariables = Types.Exact<{
  id: Types.Scalars['Int'];
}>;


export type RejectChallengeMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', decryptionChallenge: { __typename?: 'DecryptionChallengeMutation', reject: { __typename?: 'DecryptionChallengeGQL', id: number } } } };


export const DevicesPageDocument = gql`
    query DevicesPage {
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
 * __useDevicesPageQuery__
 *
 * To run a query within a React component, call `useDevicesPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useDevicesPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDevicesPageQuery({
 *   variables: {
 *   },
 * });
 */
export function useDevicesPageQuery(baseOptions?: Apollo.QueryHookOptions<DevicesPageQuery, DevicesPageQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DevicesPageQuery, DevicesPageQueryVariables>(DevicesPageDocument, options);
      }
export function useDevicesPageLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DevicesPageQuery, DevicesPageQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DevicesPageQuery, DevicesPageQueryVariables>(DevicesPageDocument, options);
        }
export type DevicesPageQueryHookResult = ReturnType<typeof useDevicesPageQuery>;
export type DevicesPageLazyQueryHookResult = ReturnType<typeof useDevicesPageLazyQuery>;
export type DevicesPageQueryResult = Apollo.QueryResult<DevicesPageQuery, DevicesPageQueryVariables>;
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