import * as Types from '../generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type AddDeviceMutationVariables = Types.Exact<{
  userId: Types.Scalars['String'];
  name: Types.Scalars['String'];
  firstIpAdress: Types.Scalars['String'];
}>;


export type AddDeviceMutation = (
  { __typename?: 'Mutation' }
  & Pick<Types.Mutation, 'addDevice'>
);


export const AddDeviceDocument = gql`
    mutation addDevice($userId: String!, $name: String!, $firstIpAdress: String!) {
  addDevice(userId: $userId, name: $name, firstIpAdress: $firstIpAdress)
}
    `;
export type AddDeviceMutationFn = Apollo.MutationFunction<AddDeviceMutation, AddDeviceMutationVariables>;

/**
 * __useAddDeviceMutation__
 *
 * To run a mutation, you first call `useAddDeviceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddDeviceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addDeviceMutation, { data, loading, error }] = useAddDeviceMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      name: // value for 'name'
 *      firstIpAdress: // value for 'firstIpAdress'
 *   },
 * });
 */
export function useAddDeviceMutation(baseOptions?: Apollo.MutationHookOptions<AddDeviceMutation, AddDeviceMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddDeviceMutation, AddDeviceMutationVariables>(AddDeviceDocument, options);
      }
export type AddDeviceMutationHookResult = ReturnType<typeof useAddDeviceMutation>;
export type AddDeviceMutationResult = Apollo.MutationResult<AddDeviceMutation>;
export type AddDeviceMutationOptions = Apollo.BaseMutationOptions<AddDeviceMutation, AddDeviceMutationVariables>;