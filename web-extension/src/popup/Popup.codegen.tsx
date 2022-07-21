import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type SendAuthMessageQueryVariables = Types.Exact<{
  device: Types.Scalars['String'];
  time: Types.Scalars['DateTime'];
  location: Types.Scalars['String'];
  pageName: Types.Scalars['String'];
}>;


export type SendAuthMessageQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', sendAuthMessage: boolean } };

export type SaveFirebaseTokenMutationVariables = Types.Exact<{
  firebaseToken: Types.Scalars['String'];
}>;


export type SaveFirebaseTokenMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', updateFireToken: { __typename?: 'DeviceGQL', id: string } } };


export const SendAuthMessageDocument = gql`
    query sendAuthMessage($device: String!, $time: DateTime!, $location: String!, $pageName: String!) {
  me {
    sendAuthMessage(
      device: $device
      time: $time
      location: $location
      pageName: $pageName
    )
  }
}
    `;

/**
 * __useSendAuthMessageQuery__
 *
 * To run a query within a React component, call `useSendAuthMessageQuery` and pass it any options that fit your needs.
 * When your component renders, `useSendAuthMessageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSendAuthMessageQuery({
 *   variables: {
 *      device: // value for 'device'
 *      time: // value for 'time'
 *      location: // value for 'location'
 *      pageName: // value for 'pageName'
 *   },
 * });
 */
export function useSendAuthMessageQuery(baseOptions: Apollo.QueryHookOptions<SendAuthMessageQuery, SendAuthMessageQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SendAuthMessageQuery, SendAuthMessageQueryVariables>(SendAuthMessageDocument, options);
      }
export function useSendAuthMessageLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SendAuthMessageQuery, SendAuthMessageQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SendAuthMessageQuery, SendAuthMessageQueryVariables>(SendAuthMessageDocument, options);
        }
export type SendAuthMessageQueryHookResult = ReturnType<typeof useSendAuthMessageQuery>;
export type SendAuthMessageLazyQueryHookResult = ReturnType<typeof useSendAuthMessageLazyQuery>;
export type SendAuthMessageQueryResult = Apollo.QueryResult<SendAuthMessageQuery, SendAuthMessageQueryVariables>;
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