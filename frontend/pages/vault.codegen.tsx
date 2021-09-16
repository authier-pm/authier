import * as Types from '../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type EncryptedSecretsQueryVariables = Types.Exact<{
  userId: Types.Scalars['String'];
}>;


export type EncryptedSecretsQuery = { __typename?: 'Query', user?: Types.Maybe<{ __typename?: 'UserQuery', secrets: Array<{ __typename?: 'EncryptedSecrets', encrypted: string, kind: Types.EncryptedSecretsType }> }> };


export const EncryptedSecretsDocument = gql`
    query encryptedSecrets($userId: String!) {
  user(userId: $userId) {
    secrets {
      encrypted
      kind
    }
  }
}
    `;

/**
 * __useEncryptedSecretsQuery__
 *
 * To run a query within a React component, call `useEncryptedSecretsQuery` and pass it any options that fit your needs.
 * When your component renders, `useEncryptedSecretsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEncryptedSecretsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useEncryptedSecretsQuery(baseOptions: Apollo.QueryHookOptions<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>(EncryptedSecretsDocument, options);
      }
export function useEncryptedSecretsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>(EncryptedSecretsDocument, options);
        }
export type EncryptedSecretsQueryHookResult = ReturnType<typeof useEncryptedSecretsQuery>;
export type EncryptedSecretsLazyQueryHookResult = ReturnType<typeof useEncryptedSecretsLazyQuery>;
export type EncryptedSecretsQueryResult = Apollo.QueryResult<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>;