import * as Types from './generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type RegisterNewUserMutationVariables = Types.Exact<{
  input: Types.RegisterNewAccountInput;
  userId: Types.Scalars['UUID'];
}>;


export type RegisterNewUserMutation = { __typename?: 'Mutation', registerNewUser: { __typename?: 'LoginResponse', accessToken: string, user: { __typename?: 'UserMutation', id: string, sendEmailVerification: number, Devices: Array<{ __typename?: 'DeviceGQL', id: string, name: string }> } } };


export const RegisterNewUserDocument = gql`
    mutation registerNewUser($input: RegisterNewAccountInput!, $userId: UUID!) {
  registerNewUser(input: $input, userId: $userId) {
    accessToken
    user {
      id
      sendEmailVerification
      Devices {
        id
        name
      }
    }
  }
}
    `;
export type RegisterNewUserMutationFn = Apollo.MutationFunction<RegisterNewUserMutation, RegisterNewUserMutationVariables>;

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
export function useRegisterNewUserMutation(baseOptions?: Apollo.MutationHookOptions<RegisterNewUserMutation, RegisterNewUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegisterNewUserMutation, RegisterNewUserMutationVariables>(RegisterNewUserDocument, options);
      }
export type RegisterNewUserMutationHookResult = ReturnType<typeof useRegisterNewUserMutation>;
export type RegisterNewUserMutationResult = Apollo.MutationResult<RegisterNewUserMutation>;
export type RegisterNewUserMutationOptions = Apollo.BaseMutationOptions<RegisterNewUserMutation, RegisterNewUserMutationVariables>;