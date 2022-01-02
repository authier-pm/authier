import * as Types from '../../shared/generated/graphqlBaseTypes'

import { gql } from '@apollo/client'
import * as Apollo from '@apollo/client'
const defaultOptions = {}
export type LoginCardMutationVariables = Types.Exact<{
  email: Types.Scalars['String']
  password: Types.Scalars['String']
}>

export type LoginCardMutation = {
  __typename?: 'Mutation'
  login?:
    | { __typename?: 'LoginResponse'; accessToken: string }
    | null
    | undefined
}

export const LoginCardDocument = gql`
  mutation LoginCard($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
    }
  }
`
export type LoginCardMutationFn = Apollo.MutationFunction<
  LoginCardMutation,
  LoginCardMutationVariables
>

/**
 * __useLoginCardMutation__
 *
 * To run a mutation, you first call `useLoginCardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginCardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginCardMutation, { data, loading, error }] = useLoginCardMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginCardMutation(
  baseOptions?: Apollo.MutationHookOptions<
    LoginCardMutation,
    LoginCardMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<LoginCardMutation, LoginCardMutationVariables>(
    LoginCardDocument,
    options
  )
}
export type LoginCardMutationHookResult = ReturnType<
  typeof useLoginCardMutation
>
export type LoginCardMutationResult = Apollo.MutationResult<LoginCardMutation>
export type LoginCardMutationOptions = Apollo.BaseMutationOptions<
  LoginCardMutation,
  LoginCardMutationVariables
>
