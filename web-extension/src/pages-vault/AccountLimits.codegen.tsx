import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type MeExtensionQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type MeExtensionQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, PasswordLimits: number, TOTPLimits: number, encryptedSecrets: Array<{ __typename?: 'EncryptedSecretQuery', kind: Types.EncryptedSecretType }> } };


export const MeExtensionDocument = gql`
    query meExtension {
  me {
    id
    encryptedSecrets {
      kind
    }
    PasswordLimits
    TOTPLimits
  }
}
    `;

/**
 * __useMeExtensionQuery__
 *
 * To run a query within a React component, call `useMeExtensionQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeExtensionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeExtensionQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeExtensionQuery(baseOptions?: Apollo.QueryHookOptions<MeExtensionQuery, MeExtensionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeExtensionQuery, MeExtensionQueryVariables>(MeExtensionDocument, options);
      }
export function useMeExtensionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeExtensionQuery, MeExtensionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeExtensionQuery, MeExtensionQueryVariables>(MeExtensionDocument, options);
        }
export type MeExtensionQueryHookResult = ReturnType<typeof useMeExtensionQuery>;
export type MeExtensionLazyQueryHookResult = ReturnType<typeof useMeExtensionLazyQuery>;
export type MeExtensionQueryResult = Apollo.QueryResult<MeExtensionQuery, MeExtensionQueryVariables>;