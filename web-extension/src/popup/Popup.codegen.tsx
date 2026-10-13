/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type SaveFirebaseTokenMutationVariables = Exact<{
  firebaseToken: string;
}>;


export type SaveFirebaseTokenMutation = { me: { updateFireToken: { id: string } } };


export const SaveFirebaseTokenDocument = gql`
    mutation saveFirebaseToken($firebaseToken: String!) {
  me {
    updateFireToken(firebaseToken: $firebaseToken) {
      id
    }
  }
}
    `;

/**
 * __useSaveFirebaseTokenMutation__
 *
 * To run a mutation, you first call `useSaveFirebaseTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveFirebaseTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveFirebaseTokenMutation, { data, loading, error }] = useSaveFirebaseTokenMutation({
 *   variables: {
 *      firebaseToken: // value for 'firebaseToken'
 *   },
 * });
 */
export function useSaveFirebaseTokenMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SaveFirebaseTokenMutation, SaveFirebaseTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SaveFirebaseTokenMutation, SaveFirebaseTokenMutationVariables>(SaveFirebaseTokenDocument, options);
      }
export type SaveFirebaseTokenMutationHookResult = ReturnType<typeof useSaveFirebaseTokenMutation>;
export type SaveFirebaseTokenMutationResult = ApolloReactCommon.MutationResult<SaveFirebaseTokenMutation>;