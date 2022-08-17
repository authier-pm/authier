import * as Types from '../../../shared/generated/graphqlBaseTypes'

import { gql } from '@apollo/client'
import * as Apollo from '@apollo/client'
const defaultOptions = {} as const
export type EncryptedAuthsQueryVariables = Types.Exact<{ [key: string]: never }>

export type EncryptedAuthsQuery = {
  __typename?: 'Query'
  me: {
    __typename?: 'UserQuery'
    id: string
    encryptedSecrets: Array<{
      __typename?: 'EncryptedSecretQuery'
      id: string
      kind: Types.EncryptedSecretType
      encrypted: string
    }>
  }
}

export const EncryptedAuthsDocument = gql`
  query encryptedAuths {
    me {
      id
      encryptedSecrets {
        id
        kind
        encrypted
      }
    }
  }
`

/**
 * __useEncryptedAuthsQuery__
 *
 * To run a query within a React component, call `useEncryptedAuthsQuery` and pass it any options that fit your needs.
 * When your component renders, `useEncryptedAuthsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEncryptedAuthsQuery({
 *   variables: {
 *   },
 * });
 */
export function useEncryptedAuthsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    EncryptedAuthsQuery,
    EncryptedAuthsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<EncryptedAuthsQuery, EncryptedAuthsQueryVariables>(
    EncryptedAuthsDocument,
    options
  )
}
export function useEncryptedAuthsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    EncryptedAuthsQuery,
    EncryptedAuthsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<EncryptedAuthsQuery, EncryptedAuthsQueryVariables>(
    EncryptedAuthsDocument,
    options
  )
}
export type EncryptedAuthsQueryHookResult = ReturnType<
  typeof useEncryptedAuthsQuery
>
export type EncryptedAuthsLazyQueryHookResult = ReturnType<
  typeof useEncryptedAuthsLazyQuery
>
export type EncryptedAuthsQueryResult = Apollo.QueryResult<
  EncryptedAuthsQuery,
  EncryptedAuthsQueryVariables
>
