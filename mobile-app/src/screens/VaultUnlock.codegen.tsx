import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type SendAuthMessageQueryVariables = Types.Exact<{
  type: Types.Scalars['String']['input'];
  body: Types.Scalars['String']['input'];
  title: Types.Scalars['String']['input'];
  deviceId: Types.Scalars['String']['input'];
}>;


export type SendAuthMessageQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', sendAuthMessage: boolean } };


export const SendAuthMessageDocument = gql`
    query sendAuthMessage($type: String!, $body: String!, $title: String!, $deviceId: String!) {
  me {
    sendAuthMessage(type: $type, body: $body, title: $title, deviceId: $deviceId)
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
 *      type: // value for 'type'
 *      body: // value for 'body'
 *      title: // value for 'title'
 *      deviceId: // value for 'deviceId'
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