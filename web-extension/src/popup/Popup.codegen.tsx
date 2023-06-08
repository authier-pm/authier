import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type SaveFirebaseTokenMutationVariables = Types.Exact<{
  firebaseToken: Types.Scalars['String']['input'];
}>;


export type SaveFirebaseTokenMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', updateFireToken: { __typename?: 'DeviceGQL', id: string } } };


export const SaveFirebaseTokenDocument = gql`
    mutation saveFirebaseToken($firebaseToken: String!) {
  me {
    updateFireToken(firebaseToken: $firebaseToken) {
      id
    }
  }
}
    `;
export type SaveFirebaseTokenMutationFn = Apollo.MutationFunction<SaveFirebaseTokenMutation, SaveFirebaseTokenMutationVariables>;

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
export function useSaveFirebaseTokenMutation(baseOptions?: Apollo.MutationHookOptions<SaveFirebaseTokenMutation, SaveFirebaseTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SaveFirebaseTokenMutation, SaveFirebaseTokenMutationVariables>(SaveFirebaseTokenDocument, options);
      }
export type SaveFirebaseTokenMutationHookResult = ReturnType<typeof useSaveFirebaseTokenMutation>;
export type SaveFirebaseTokenMutationResult = Apollo.MutationResult<SaveFirebaseTokenMutation>;
export type SaveFirebaseTokenMutationOptions = Apollo.BaseMutationOptions<SaveFirebaseTokenMutation, SaveFirebaseTokenMutationVariables>;