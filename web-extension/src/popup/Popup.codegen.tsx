import * as Types from '../../../shared/generated/graphqlBaseTypes'

import { gql } from '@apollo/client'
import * as Apollo from '@apollo/client'
const defaultOptions = {}
export type IsLoggedInQueryVariables = Types.Exact<{ [key: string]: never }>

export type IsLoggedInQuery = { __typename?: 'Query'; authenticated: boolean }

export type SettingsQueryVariables = Types.Exact<{ [key: string]: never }>

export type SettingsQuery = {
  __typename?: 'Query'
  me?:
    | {
        __typename?: 'UserQuery'
        settings: {
          __typename?: 'SettingsConfig'
          lockTime: number
          twoFA: boolean
          noHandsLogin: boolean
          homeUI: string
        }
      }
    | null
    | undefined
}

export type SaveEncryptedSecretsMutationVariables = Types.Exact<{
  payload: Types.Scalars['String']
  kind: Types.EncryptedSecretsType
}>

export type SaveEncryptedSecretsMutation = {
  __typename?: 'Mutation'
  me?:
    | {
        __typename?: 'UserMutation'
        saveEncryptedSecrets: {
          __typename?: 'EncryptedSecrets'
          encrypted: string
        }
      }
    | null
    | undefined
}

export type SendAuthMessageQueryVariables = Types.Exact<{
  device: Types.Scalars['String']
  time: Types.Scalars['String']
  location: Types.Scalars['String']
  userId: Types.Scalars['String']
  pageName: Types.Scalars['String']
}>

export type SendAuthMessageQuery = {
  __typename?: 'Query'
  sendAuthMessage: boolean
}

export type SaveFirebaseTokenMutationVariables = Types.Exact<{
  firebaseToken: Types.Scalars['String']
}>

export type SaveFirebaseTokenMutation = {
  __typename?: 'Mutation'
  me?:
    | {
        __typename?: 'UserMutation'
        updateFireToken: { __typename?: 'Device'; id: number }
      }
    | null
    | undefined
}

export const IsLoggedInDocument = gql`
  query isLoggedIn {
    authenticated
  }
`

/**
 * __useIsLoggedInQuery__
 *
 * To run a query within a React component, call `useIsLoggedInQuery` and pass it any options that fit your needs.
 * When your component renders, `useIsLoggedInQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useIsLoggedInQuery({
 *   variables: {
 *   },
 * });
 */
export function useIsLoggedInQuery(
  baseOptions?: Apollo.QueryHookOptions<
    IsLoggedInQuery,
    IsLoggedInQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<IsLoggedInQuery, IsLoggedInQueryVariables>(
    IsLoggedInDocument,
    options
  )
}
export function useIsLoggedInLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    IsLoggedInQuery,
    IsLoggedInQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<IsLoggedInQuery, IsLoggedInQueryVariables>(
    IsLoggedInDocument,
    options
  )
}
export type IsLoggedInQueryHookResult = ReturnType<typeof useIsLoggedInQuery>
export type IsLoggedInLazyQueryHookResult = ReturnType<
  typeof useIsLoggedInLazyQuery
>
export type IsLoggedInQueryResult = Apollo.QueryResult<
  IsLoggedInQuery,
  IsLoggedInQueryVariables
>
export const SettingsDocument = gql`
  query settings {
    me {
      settings {
        lockTime
        twoFA
        noHandsLogin
        homeUI
      }
    }
  }
`

/**
 * __useSettingsQuery__
 *
 * To run a query within a React component, call `useSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSettingsQuery(
  baseOptions?: Apollo.QueryHookOptions<SettingsQuery, SettingsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SettingsQuery, SettingsQueryVariables>(
    SettingsDocument,
    options
  )
}
export function useSettingsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SettingsQuery,
    SettingsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<SettingsQuery, SettingsQueryVariables>(
    SettingsDocument,
    options
  )
}
export type SettingsQueryHookResult = ReturnType<typeof useSettingsQuery>
export type SettingsLazyQueryHookResult = ReturnType<
  typeof useSettingsLazyQuery
>
export type SettingsQueryResult = Apollo.QueryResult<
  SettingsQuery,
  SettingsQueryVariables
>
export const SaveEncryptedSecretsDocument = gql`
  mutation saveEncryptedSecrets(
    $payload: String!
    $kind: EncryptedSecretsType!
  ) {
    me {
      saveEncryptedSecrets(kind: $kind, payload: $payload) {
        encrypted
      }
    }
  }
`
export type SaveEncryptedSecretsMutationFn = Apollo.MutationFunction<
  SaveEncryptedSecretsMutation,
  SaveEncryptedSecretsMutationVariables
>

/**
 * __useSaveEncryptedSecretsMutation__
 *
 * To run a mutation, you first call `useSaveEncryptedSecretsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveEncryptedSecretsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveEncryptedSecretsMutation, { data, loading, error }] = useSaveEncryptedSecretsMutation({
 *   variables: {
 *      payload: // value for 'payload'
 *      kind: // value for 'kind'
 *   },
 * });
 */
export function useSaveEncryptedSecretsMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SaveEncryptedSecretsMutation,
    SaveEncryptedSecretsMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<
    SaveEncryptedSecretsMutation,
    SaveEncryptedSecretsMutationVariables
  >(SaveEncryptedSecretsDocument, options)
}
export type SaveEncryptedSecretsMutationHookResult = ReturnType<
  typeof useSaveEncryptedSecretsMutation
>
export type SaveEncryptedSecretsMutationResult =
  Apollo.MutationResult<SaveEncryptedSecretsMutation>
export type SaveEncryptedSecretsMutationOptions = Apollo.BaseMutationOptions<
  SaveEncryptedSecretsMutation,
  SaveEncryptedSecretsMutationVariables
>
export const SendAuthMessageDocument = gql`
  query sendAuthMessage(
    $device: String!
    $time: String!
    $location: String!
    $userId: String!
    $pageName: String!
  ) {
    sendAuthMessage(
      device: $device
      time: $time
      location: $location
      userId: $userId
      pageName: $pageName
    )
  }
`

/**
 * __useSendAuthMessageQuery__
 *
 * To run a query within a React component, call `useSendAuthMessageQuery` and pass it any options that fit your needs.
 * When your component renders, `useSendAuthMessageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSendAuthMessageQuery({
 *   variables: {
 *      device: // value for 'device'
 *      time: // value for 'time'
 *      location: // value for 'location'
 *      userId: // value for 'userId'
 *      pageName: // value for 'pageName'
 *   },
 * });
 */
export function useSendAuthMessageQuery(
  baseOptions: Apollo.QueryHookOptions<
    SendAuthMessageQuery,
    SendAuthMessageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SendAuthMessageQuery, SendAuthMessageQueryVariables>(
    SendAuthMessageDocument,
    options
  )
}
export function useSendAuthMessageLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SendAuthMessageQuery,
    SendAuthMessageQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<
    SendAuthMessageQuery,
    SendAuthMessageQueryVariables
  >(SendAuthMessageDocument, options)
}
export type SendAuthMessageQueryHookResult = ReturnType<
  typeof useSendAuthMessageQuery
>
export type SendAuthMessageLazyQueryHookResult = ReturnType<
  typeof useSendAuthMessageLazyQuery
>
export type SendAuthMessageQueryResult = Apollo.QueryResult<
  SendAuthMessageQuery,
  SendAuthMessageQueryVariables
>
export const SaveFirebaseTokenDocument = gql`
  mutation saveFirebaseToken($firebaseToken: String!) {
    me {
      updateFireToken(firebaseToken: $firebaseToken) {
        id
      }
    }
  }
`
export type SaveFirebaseTokenMutationFn = Apollo.MutationFunction<
  SaveFirebaseTokenMutation,
  SaveFirebaseTokenMutationVariables
>

/**
 * __useSaveFirebaseTokenMutation__
 *
 * To run a mutation, you first call `useSaveFirebaseTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveFirebaseTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveFirebaseTokenMutation, { data, loading, error }] = useSaveFirebaseTokenMutation({
 *   variables: {
 *      firebaseToken: // value for 'firebaseToken'
 *   },
 * });
 */
export function useSaveFirebaseTokenMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SaveFirebaseTokenMutation,
    SaveFirebaseTokenMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<
    SaveFirebaseTokenMutation,
    SaveFirebaseTokenMutationVariables
  >(SaveFirebaseTokenDocument, options)
}
export type SaveFirebaseTokenMutationHookResult = ReturnType<
  typeof useSaveFirebaseTokenMutation
>
export type SaveFirebaseTokenMutationResult =
  Apollo.MutationResult<SaveFirebaseTokenMutation>
export type SaveFirebaseTokenMutationOptions = Apollo.BaseMutationOptions<
  SaveFirebaseTokenMutation,
  SaveFirebaseTokenMutationVariables
>
