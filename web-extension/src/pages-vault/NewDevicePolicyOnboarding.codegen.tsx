import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UpdateNewDevicePolicyMutationVariables = Types.Exact<{
  newDevicePolicy: Types.UserNewDevicePolicy;
}>;


export type UpdateNewDevicePolicyMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', setNewDevicePolicy: { __typename?: 'UserGQL', id: string, newDevicePolicy?: Types.UserNewDevicePolicy | null } } };


export const UpdateNewDevicePolicyDocument = gql`
    mutation UpdateNewDevicePolicy($newDevicePolicy: UserNewDevicePolicy!) {
  me {
    setNewDevicePolicy(newDevicePolicy: $newDevicePolicy) {
      id
      newDevicePolicy
    }
  }
}
    `;
export type UpdateNewDevicePolicyMutationFn = Apollo.MutationFunction<UpdateNewDevicePolicyMutation, UpdateNewDevicePolicyMutationVariables>;

/**
 * __useUpdateNewDevicePolicyMutation__
 *
 * To run a mutation, you first call `useUpdateNewDevicePolicyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNewDevicePolicyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNewDevicePolicyMutation, { data, loading, error }] = useUpdateNewDevicePolicyMutation({
 *   variables: {
 *      newDevicePolicy: // value for 'newDevicePolicy'
 *   },
 * });
 */
export function useUpdateNewDevicePolicyMutation(baseOptions?: Apollo.MutationHookOptions<UpdateNewDevicePolicyMutation, UpdateNewDevicePolicyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateNewDevicePolicyMutation, UpdateNewDevicePolicyMutationVariables>(UpdateNewDevicePolicyDocument, options);
      }
export type UpdateNewDevicePolicyMutationHookResult = ReturnType<typeof useUpdateNewDevicePolicyMutation>;
export type UpdateNewDevicePolicyMutationResult = Apollo.MutationResult<UpdateNewDevicePolicyMutation>;
export type UpdateNewDevicePolicyMutationOptions = Apollo.BaseMutationOptions<UpdateNewDevicePolicyMutation, UpdateNewDevicePolicyMutationVariables>;