import * as Types from '../../../shared/generated/graphqlBaseTypes'

import { gql } from '@apollo/client'
import * as Apollo from '@apollo/client'
const defaultOptions = {} as const
export type MyDevicesQueryVariables = Types.Exact<{ [key: string]: never }>

export type MyDevicesQuery = {
  __typename?: 'Query'
  me: {
    __typename?: 'UserQuery'
    id: string
    masterDeviceId?: string | null
    devices: Array<{
      __typename?: 'DeviceQuery'
      id: string
      name: string
      firstIpAddress: string
      lastIpAddress: string
      logoutAt?: string | null
      lastGeoLocation: string
      createdAt: string
      lastSyncAt?: string | null
      platform: string
    }>
  }
}

export type RejectChallengeMutationVariables = Types.Exact<{
  id: Types.Scalars['Int']
}>

export type RejectChallengeMutation = {
  __typename?: 'Mutation'
  me: {
    __typename?: 'UserMutation'
    decryptionChallenge: {
      __typename?: 'DecryptionChallengeMutation'
      reject: { __typename?: 'DecryptionChallengeGQL'; id: number }
    }
  }
}

export type ApproveChallengeMutationVariables = Types.Exact<{
  id: Types.Scalars['Int']
}>

export type ApproveChallengeMutation = {
  __typename?: 'Mutation'
  me: {
    __typename?: 'UserMutation'
    decryptionChallenge: {
      __typename?: 'DecryptionChallengeMutation'
      approve: { __typename?: 'DecryptionChallengeGQL'; id: number }
    }
  }
}

export type DeviceRequestQueryVariables = Types.Exact<{ [key: string]: never }>

export type DeviceRequestQuery = {
  __typename?: 'Query'
  me: {
    __typename?: 'UserQuery'
    id: string
    masterDeviceId?: string | null
    decryptionChallengesWaiting: Array<{
      __typename?: 'DecryptionChallengeForApproval'
      id: number
      createdAt: string
      deviceName: string
      deviceId: any
    }>
  }
}

export const MyDevicesDocument = gql`
  query myDevices {
    me {
      id
      masterDeviceId
      devices {
        id
        name
        firstIpAddress
        lastIpAddress
        logoutAt
        lastGeoLocation
        createdAt
        lastSyncAt
        platform
        createdAt
      }
    }
  }
`

/**
 * __useMyDevicesQuery__
 *
 * To run a query within a React component, call `useMyDevicesQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyDevicesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyDevicesQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyDevicesQuery(
  baseOptions?: Apollo.QueryHookOptions<MyDevicesQuery, MyDevicesQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<MyDevicesQuery, MyDevicesQueryVariables>(
    MyDevicesDocument,
    options
  )
}
export function useMyDevicesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    MyDevicesQuery,
    MyDevicesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<MyDevicesQuery, MyDevicesQueryVariables>(
    MyDevicesDocument,
    options
  )
}
export type MyDevicesQueryHookResult = ReturnType<typeof useMyDevicesQuery>
export type MyDevicesLazyQueryHookResult = ReturnType<
  typeof useMyDevicesLazyQuery
>
export type MyDevicesQueryResult = Apollo.QueryResult<
  MyDevicesQuery,
  MyDevicesQueryVariables
>
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
`
export type RejectChallengeMutationFn = Apollo.MutationFunction<
  RejectChallengeMutation,
  RejectChallengeMutationVariables
>

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
export function useRejectChallengeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RejectChallengeMutation,
    RejectChallengeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<
    RejectChallengeMutation,
    RejectChallengeMutationVariables
  >(RejectChallengeDocument, options)
}
export type RejectChallengeMutationHookResult = ReturnType<
  typeof useRejectChallengeMutation
>
export type RejectChallengeMutationResult =
  Apollo.MutationResult<RejectChallengeMutation>
export type RejectChallengeMutationOptions = Apollo.BaseMutationOptions<
  RejectChallengeMutation,
  RejectChallengeMutationVariables
>
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
`
export type ApproveChallengeMutationFn = Apollo.MutationFunction<
  ApproveChallengeMutation,
  ApproveChallengeMutationVariables
>

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
export function useApproveChallengeMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ApproveChallengeMutation,
    ApproveChallengeMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<
    ApproveChallengeMutation,
    ApproveChallengeMutationVariables
  >(ApproveChallengeDocument, options)
}
export type ApproveChallengeMutationHookResult = ReturnType<
  typeof useApproveChallengeMutation
>
export type ApproveChallengeMutationResult =
  Apollo.MutationResult<ApproveChallengeMutation>
export type ApproveChallengeMutationOptions = Apollo.BaseMutationOptions<
  ApproveChallengeMutation,
  ApproveChallengeMutationVariables
>
export const DeviceRequestDocument = gql`
  query DeviceRequest {
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
`

/**
 * __useDeviceRequestQuery__
 *
 * To run a query within a React component, call `useDeviceRequestQuery` and pass it any options that fit your needs.
 * When your component renders, `useDeviceRequestQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDeviceRequestQuery({
 *   variables: {
 *   },
 * });
 */
export function useDeviceRequestQuery(
  baseOptions?: Apollo.QueryHookOptions<
    DeviceRequestQuery,
    DeviceRequestQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<DeviceRequestQuery, DeviceRequestQueryVariables>(
    DeviceRequestDocument,
    options
  )
}
export function useDeviceRequestLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    DeviceRequestQuery,
    DeviceRequestQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<DeviceRequestQuery, DeviceRequestQueryVariables>(
    DeviceRequestDocument,
    options
  )
}
export type DeviceRequestQueryHookResult = ReturnType<
  typeof useDeviceRequestQuery
>
export type DeviceRequestLazyQueryHookResult = ReturnType<
  typeof useDeviceRequestLazyQuery
>
export type DeviceRequestQueryResult = Apollo.QueryResult<
  DeviceRequestQuery,
  DeviceRequestQueryVariables
>
