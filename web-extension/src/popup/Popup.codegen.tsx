import * as Types from '../generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type IsLoggedInQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type IsLoggedInQuery = (
  { __typename?: 'Query' }
  & Pick<Types.Query, 'authenticated'>
);

export type SaveAuthsMutationVariables = Types.Exact<{
  userId: Types.Scalars['String'];
  payload: Types.Scalars['String'];
}>;


export type SaveAuthsMutation = (
  { __typename?: 'Mutation' }
  & Pick<Types.Mutation, 'saveAuths'>
);

export type SendAuthMessageQueryVariables = Types.Exact<{
  device: Types.Scalars['String'];
  time: Types.Scalars['String'];
  location: Types.Scalars['String'];
  userId: Types.Scalars['String'];
  pageName: Types.Scalars['String'];
}>;


export type SendAuthMessageQuery = (
  { __typename?: 'Query' }
  & Pick<Types.Query, 'sendAuthMessage'>
);


export const IsLoggedInDocument = gql`
    query isLoggedIn {
  authenticated
}
    `;

/**
 * __useIsLoggedInQuery__
 *
 * To run a query within a React component, call `useIsLoggedInQuery` and pass it any options that fit your needs.
 * When your component renders, `useIsLoggedInQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useIsLoggedInQuery({
 *   variables: {
 *   },
 * });
 */
export function useIsLoggedInQuery(baseOptions?: Apollo.QueryHookOptions<IsLoggedInQuery, IsLoggedInQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<IsLoggedInQuery, IsLoggedInQueryVariables>(IsLoggedInDocument, options);
      }
export function useIsLoggedInLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IsLoggedInQuery, IsLoggedInQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<IsLoggedInQuery, IsLoggedInQueryVariables>(IsLoggedInDocument, options);
        }
export type IsLoggedInQueryHookResult = ReturnType<typeof useIsLoggedInQuery>;
export type IsLoggedInLazyQueryHookResult = ReturnType<typeof useIsLoggedInLazyQuery>;
export type IsLoggedInQueryResult = Apollo.QueryResult<IsLoggedInQuery, IsLoggedInQueryVariables>;
export const SaveAuthsDocument = gql`
    mutation saveAuths($userId: String!, $payload: String!) {
  saveAuths(userId: $userId, payload: $payload)
}
    `;
export type SaveAuthsMutationFn = Apollo.MutationFunction<SaveAuthsMutation, SaveAuthsMutationVariables>;

/**
 * __useSaveAuthsMutation__
 *
 * To run a mutation, you first call `useSaveAuthsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveAuthsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveAuthsMutation, { data, loading, error }] = useSaveAuthsMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      payload: // value for 'payload'
 *   },
 * });
 */
export function useSaveAuthsMutation(baseOptions?: Apollo.MutationHookOptions<SaveAuthsMutation, SaveAuthsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SaveAuthsMutation, SaveAuthsMutationVariables>(SaveAuthsDocument, options);
      }
export type SaveAuthsMutationHookResult = ReturnType<typeof useSaveAuthsMutation>;
export type SaveAuthsMutationResult = Apollo.MutationResult<SaveAuthsMutation>;
export type SaveAuthsMutationOptions = Apollo.BaseMutationOptions<SaveAuthsMutation, SaveAuthsMutationVariables>;
export const SendAuthMessageDocument = gql`
    query sendAuthMessage($device: String!, $time: String!, $location: String!, $userId: String!, $pageName: String!) {
  sendAuthMessage(
    device: $device
    time: $time
    location: $location
    userId: $userId
    pageName: $pageName
  )
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
 *      userId: // value for 'userId'
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