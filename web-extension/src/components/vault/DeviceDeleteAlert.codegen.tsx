import * as Types from '../../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type LogoutDeviceMutationVariables = Types.Exact<{
  id: Types.Scalars['String'];
}>;


export type LogoutDeviceMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', device: { __typename?: 'DeviceMutation', logout: { __typename?: 'DeviceGQL', id: string } } } };

export type RemoveDeviceMutationVariables = Types.Exact<{
  id: Types.Scalars['String'];
}>;


export type RemoveDeviceMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', device: { __typename?: 'DeviceMutation', removeDevice: boolean } } };


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
export type LogoutDeviceMutationFn = Apollo.MutationFunction<LogoutDeviceMutation, LogoutDeviceMutationVariables>;

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
export function useLogoutDeviceMutation(baseOptions?: Apollo.MutationHookOptions<LogoutDeviceMutation, LogoutDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LogoutDeviceMutation, LogoutDeviceMutationVariables>(LogoutDeviceDocument, options);
      }
export type LogoutDeviceMutationHookResult = ReturnType<typeof useLogoutDeviceMutation>;
export type LogoutDeviceMutationResult = Apollo.MutationResult<LogoutDeviceMutation>;
export type LogoutDeviceMutationOptions = Apollo.BaseMutationOptions<LogoutDeviceMutation, LogoutDeviceMutationVariables>;
export const RemoveDeviceDocument = gql`
    mutation removeDevice($id: String!) {
  me {
    device(id: $id) {
      removeDevice
    }
  }
}
    `;
export type RemoveDeviceMutationFn = Apollo.MutationFunction<RemoveDeviceMutation, RemoveDeviceMutationVariables>;

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
export function useRemoveDeviceMutation(baseOptions?: Apollo.MutationHookOptions<RemoveDeviceMutation, RemoveDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveDeviceMutation, RemoveDeviceMutationVariables>(RemoveDeviceDocument, options);
      }
export type RemoveDeviceMutationHookResult = ReturnType<typeof useRemoveDeviceMutation>;
export type RemoveDeviceMutationResult = Apollo.MutationResult<RemoveDeviceMutation>;
export type RemoveDeviceMutationOptions = Apollo.BaseMutationOptions<RemoveDeviceMutation, RemoveDeviceMutationVariables>;