import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type AddWebInputsMutationVariables = Types.Exact<{
  webInputs: Array<Types.WebInputElement> | Types.WebInputElement;
}>;


export type AddWebInputsMutation = { __typename?: 'Mutation', addWebInputs: Array<{ __typename?: 'WebInputGQL', id: string }> };


export const AddWebInputsDocument = gql`
    mutation addWebInputs($webInputs: [WebInputElement!]!) {
  addWebInputs(webInputs: $webInputs) {
    id
  }
}
    `;
export type AddWebInputsMutationFn = Apollo.MutationFunction<AddWebInputsMutation, AddWebInputsMutationVariables>;

/**
 * __useAddWebInputsMutation__
 *
 * To run a mutation, you first call `useAddWebInputsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddWebInputsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addWebInputsMutation, { data, loading, error }] = useAddWebInputsMutation({
 *   variables: {
 *      webInputs: // value for 'webInputs'
 *   },
 * });
 */
export function useAddWebInputsMutation(baseOptions?: Apollo.MutationHookOptions<AddWebInputsMutation, AddWebInputsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddWebInputsMutation, AddWebInputsMutationVariables>(AddWebInputsDocument, options);
      }
export type AddWebInputsMutationHookResult = ReturnType<typeof useAddWebInputsMutation>;
export type AddWebInputsMutationResult = Apollo.MutationResult<AddWebInputsMutation>;
export type AddWebInputsMutationOptions = Apollo.BaseMutationOptions<AddWebInputsMutation, AddWebInputsMutationVariables>;