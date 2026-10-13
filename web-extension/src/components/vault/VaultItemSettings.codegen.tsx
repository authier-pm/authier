/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type RemoveWebInputMutationVariables = Exact<{
  id: number;
}>;


export type RemoveWebInputMutation = { webInput: { delete: { id: number } | null } | null };


export const RemoveWebInputDocument = gql`
    mutation removeWebInput($id: Int!) {
  webInput(id: $id) {
    delete {
      id
    }
  }
}
    `;

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
export function useRemoveWebInputMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RemoveWebInputMutation, RemoveWebInputMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RemoveWebInputMutation, RemoveWebInputMutationVariables>(RemoveWebInputDocument, options);
      }
export type RemoveWebInputMutationHookResult = ReturnType<typeof useRemoveWebInputMutation>;
export type RemoveWebInputMutationResult = ApolloReactCommon.MutationResult<RemoveWebInputMutation>;