import * as Types from '../generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type SendConfirmationQueryVariables = Types.Exact<{
  userId: Types.Scalars['String'];
  success: Types.Scalars['Boolean'];
}>;


export type SendConfirmationQuery = (
  { __typename?: 'Query' }
  & Pick<Types.Query, 'sendConfirmation'>
);


export const SendConfirmationDocument = gql`
    query sendConfirmation($userId: String!, $success: Boolean!) {
  sendConfirmation(userId: $userId, success: $success)
}
    `;

/**
 * __useSendConfirmationQuery__
 *
 * To run a query within a React component, call `useSendConfirmationQuery` and pass it any options that fit your needs.
 * When your component renders, `useSendConfirmationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSendConfirmationQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      success: // value for 'success'
 *   },
 * });
 */
export function useSendConfirmationQuery(baseOptions: Apollo.QueryHookOptions<SendConfirmationQuery, SendConfirmationQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SendConfirmationQuery, SendConfirmationQueryVariables>(SendConfirmationDocument, options);
      }
export function useSendConfirmationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SendConfirmationQuery, SendConfirmationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SendConfirmationQuery, SendConfirmationQueryVariables>(SendConfirmationDocument, options);
        }
export type SendConfirmationQueryHookResult = ReturnType<typeof useSendConfirmationQuery>;
export type SendConfirmationLazyQueryHookResult = ReturnType<typeof useSendConfirmationLazyQuery>;
export type SendConfirmationQueryResult = Apollo.QueryResult<SendConfirmationQuery, SendConfirmationQueryVariables>;