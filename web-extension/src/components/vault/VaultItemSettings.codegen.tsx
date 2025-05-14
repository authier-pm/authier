import * as Types from '../../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type RemoveWebInputMutationVariables = Types.Exact<{
  id: Types.Scalars['Int']['input'];
}>;


export type RemoveWebInputMutation = { __typename?: 'Mutation', webInput?: { __typename?: 'WebInputMutation', delete?: { __typename?: 'WebInputGQLScalars', id: number } | null } | null };


export const RemoveWebInputDocument = gql`
    mutation removeWebInput($id: Int!) {
  webInput(id: $id) {
    delete {
      id
    }
  }
}
    `;
export type RemoveWebInputMutationFn = Apollo.MutationFunction<RemoveWebInputMutation, RemoveWebInputMutationVariables>;

/**
 * __useRemoveWebInputMutation__
 *
 * To run a mutation, you first call `useRemoveWebInputMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveWebInputMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeWebInputMutation, { data, loading, error }] = useRemoveWebInputMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRemoveWebInputMutation(baseOptions?: Apollo.MutationHookOptions<RemoveWebInputMutation, RemoveWebInputMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveWebInputMutation, RemoveWebInputMutationVariables>(RemoveWebInputDocument, options);
      }
export type RemoveWebInputMutationHookResult = ReturnType<typeof useRemoveWebInputMutation>;
export type RemoveWebInputMutationResult = Apollo.MutationResult<RemoveWebInputMutation>;
export type RemoveWebInputMutationOptions = Apollo.BaseMutationOptions<RemoveWebInputMutation, RemoveWebInputMutationVariables>;