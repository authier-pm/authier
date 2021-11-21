import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions =  {}
export type EncryptedSecretsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type EncryptedSecretsQuery = { __typename?: 'Query', me?: { __typename?: 'UserQuery', id: string, email?: any | null | undefined, EncryptedSecrets: Array<{ __typename?: 'EncryptedSecretGQL', id: string, encrypted: string, kind: Types.EncryptedSecretType, createdAt: string, updatedAt?: string | null | undefined, url?: string | null | undefined }> } | null | undefined };


export const EncryptedSecretsDocument = gql`
    query EncryptedSecrets {
  me {
    id
    email
    EncryptedSecrets {
      id
      encrypted
      kind
      createdAt
      updatedAt
      url
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
 *   },
 * });
 */
export function useEncryptedSecretsQuery(baseOptions?: Apollo.QueryHookOptions<EncryptedSecretsQuery, EncryptedSecretsQueryVariables>) {
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