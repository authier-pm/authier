import * as Types from './generated/graphqlBaseTypes'

import { gql } from '@apollo/client'
import * as Apollo from '@apollo/client'
const defaultOptions = {}
export type RegisterNewUserMutationVariables = Types.Exact<{
  input: Types.RegisterNewDeviceInput
  userId: Types.Scalars['UUID']
}>

export type RegisterNewUserMutation = {
  __typename?: 'Mutation'
  registerNewUser: {
    __typename?: 'LoginResponse'
    accessToken: string
    user: {
      __typename?: 'UserAfterAuth'
      id: string
      EncryptedSecrets?:
        | Array<{
            __typename?: 'EncryptedSecret'
            encrypted: string
            kind: Types.EncryptedSecretType
            id: number
          }>
        | null
        | undefined
    }
  }
}

export type DeviceDecryptionChallengeQueryVariables = Types.Exact<{
  email: Types.Scalars['EmailAddress']
}>

export type DeviceDecryptionChallengeQuery = {
  __typename?: 'Query'
  deviceDecryptionChallenge: Array<string>
}

export const RegisterNewUserDocument = gql`
  mutation registerNewUser($input: RegisterNewDeviceInput!, $userId: UUID!) {
    registerNewUser(input: $input, userId: $userId) {
      accessToken
      user {
        id
        EncryptedSecrets {
          encrypted
          kind
          id
        }
      }
    }
  }
`
export type RegisterNewUserMutationFn = Apollo.MutationFunction<
  RegisterNewUserMutation,
  RegisterNewUserMutationVariables
>

/**
 * __useRegisterNewUserMutation__
 *
 * To run a mutation, you first call `useRegisterNewUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterNewUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerNewUserMutation, { data, loading, error }] = useRegisterNewUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useRegisterNewUserMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RegisterNewUserMutation,
    RegisterNewUserMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<
    RegisterNewUserMutation,
    RegisterNewUserMutationVariables
  >(RegisterNewUserDocument, options)
}
export type RegisterNewUserMutationHookResult = ReturnType<
  typeof useRegisterNewUserMutation
>
export type RegisterNewUserMutationResult =
  Apollo.MutationResult<RegisterNewUserMutation>
export type RegisterNewUserMutationOptions = Apollo.BaseMutationOptions<
  RegisterNewUserMutation,
  RegisterNewUserMutationVariables
>
export const DeviceDecryptionChallengeDocument = gql`
  query deviceDecryptionChallenge($email: EmailAddress!) {
    deviceDecryptionChallenge(email: $email)
  }
`

/**
 * __useDeviceDecryptionChallengeQuery__
 *
 * To run a query within a React component, call `useDeviceDecryptionChallengeQuery` and pass it any options that fit your needs.
 * When your component renders, `useDeviceDecryptionChallengeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDeviceDecryptionChallengeQuery({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useDeviceDecryptionChallengeQuery(
  baseOptions: Apollo.QueryHookOptions<
    DeviceDecryptionChallengeQuery,
    DeviceDecryptionChallengeQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<
    DeviceDecryptionChallengeQuery,
    DeviceDecryptionChallengeQueryVariables
  >(DeviceDecryptionChallengeDocument, options)
}
export function useDeviceDecryptionChallengeLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    DeviceDecryptionChallengeQuery,
    DeviceDecryptionChallengeQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<
    DeviceDecryptionChallengeQuery,
    DeviceDecryptionChallengeQueryVariables
  >(DeviceDecryptionChallengeDocument, options)
}
export type DeviceDecryptionChallengeQueryHookResult = ReturnType<
  typeof useDeviceDecryptionChallengeQuery
>
export type DeviceDecryptionChallengeLazyQueryHookResult = ReturnType<
  typeof useDeviceDecryptionChallengeLazyQuery
>
export type DeviceDecryptionChallengeQueryResult = Apollo.QueryResult<
  DeviceDecryptionChallengeQuery,
  DeviceDecryptionChallengeQueryVariables
>
