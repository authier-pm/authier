import * as Types from './generated/graphqlBaseTypes'

import { gql } from '@apollo/client'
import * as Apollo from '@apollo/client'
const defaultOptions = {}
export type AddNewDeviceForUserMutationVariables = Types.Exact<{
  currentAddDeviceSecret: Types.Scalars['String']
  input: Types.RegisterNewDeviceInput
}>

export type AddNewDeviceForUserMutation = {
  __typename?: 'Mutation'
  addNewDeviceForUser: {
    __typename?: 'LoginResponse'
    accessToken: string
    user: {
      __typename?: 'UserAfterAuth'
      EncryptedSecrets?:
        | Array<{
            __typename?: 'EncryptedSecret'
            id: number
            kind: Types.EncryptedSecretType
            encrypted: string
          }>
        | null
        | undefined
    }
  }
}

export const AddNewDeviceForUserDocument = gql`
  mutation addNewDeviceForUser(
    $currentAddDeviceSecret: String!
    $input: RegisterNewDeviceInput!
  ) {
    addNewDeviceForUser(
      currentAddDeviceSecret: $currentAddDeviceSecret
      input: $input
    ) {
      accessToken
      user {
        EncryptedSecrets {
          id
          kind
          encrypted
        }
      }
    }
  }
`
export type AddNewDeviceForUserMutationFn = Apollo.MutationFunction<
  AddNewDeviceForUserMutation,
  AddNewDeviceForUserMutationVariables
>

/**
 * __useAddNewDeviceForUserMutation__
 *
 * To run a mutation, you first call `useAddNewDeviceForUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddNewDeviceForUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addNewDeviceForUserMutation, { data, loading, error }] = useAddNewDeviceForUserMutation({
 *   variables: {
 *      currentAddDeviceSecret: // value for 'currentAddDeviceSecret'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddNewDeviceForUserMutation(
  baseOptions?: Apollo.MutationHookOptions<
    AddNewDeviceForUserMutation,
    AddNewDeviceForUserMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<
    AddNewDeviceForUserMutation,
    AddNewDeviceForUserMutationVariables
  >(AddNewDeviceForUserDocument, options)
}
export type AddNewDeviceForUserMutationHookResult = ReturnType<
  typeof useAddNewDeviceForUserMutation
>
export type AddNewDeviceForUserMutationResult =
  Apollo.MutationResult<AddNewDeviceForUserMutation>
export type AddNewDeviceForUserMutationOptions = Apollo.BaseMutationOptions<
  AddNewDeviceForUserMutation,
  AddNewDeviceForUserMutationVariables
>
