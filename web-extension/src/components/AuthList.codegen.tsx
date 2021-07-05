import * as Types from '../generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type AddOtpEventMutationVariables = Types.Exact<{
  userId: Types.Scalars['String'];
  kind: Types.Scalars['String'];
  url: Types.Scalars['String'];
}>;


export type AddOtpEventMutation = (
  { __typename?: 'Mutation' }
  & Pick<Types.Mutation, 'addOTPEvent'>
);


export const AddOtpEventDocument = gql`
    mutation addOTPEvent($userId: String!, $kind: String!, $url: String!) {
  addOTPEvent(data: {userId: $userId, kind: $kind, url: $url})
}
    `;
export type AddOtpEventMutationFn = Apollo.MutationFunction<AddOtpEventMutation, AddOtpEventMutationVariables>;

/**
 * __useAddOtpEventMutation__
 *
 * To run a mutation, you first call `useAddOtpEventMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddOtpEventMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addOtpEventMutation, { data, loading, error }] = useAddOtpEventMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      kind: // value for 'kind'
 *      url: // value for 'url'
 *   },
 * });
 */
export function useAddOtpEventMutation(baseOptions?: Apollo.MutationHookOptions<AddOtpEventMutation, AddOtpEventMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddOtpEventMutation, AddOtpEventMutationVariables>(AddOtpEventDocument, options);
      }
export type AddOtpEventMutationHookResult = ReturnType<typeof useAddOtpEventMutation>;
export type AddOtpEventMutationResult = Apollo.MutationResult<AddOtpEventMutation>;
export type AddOtpEventMutationOptions = Apollo.BaseMutationOptions<AddOtpEventMutation, AddOtpEventMutationVariables>;