import * as Types from '../../../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UiLanguageQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type UiLanguageQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, uiLanguage: string } };


export const UiLanguageDocument = gql`
    query uiLanguage {
  me {
    id
    uiLanguage
  }
}
    `;

/**
 * __useUiLanguageQuery__
 *
 * To run a query within a React component, call `useUiLanguageQuery` and pass it any options that fit your needs.
 * When your component renders, `useUiLanguageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUiLanguageQuery({
 *   variables: {
 *   },
 * });
 */
export function useUiLanguageQuery(baseOptions?: Apollo.QueryHookOptions<UiLanguageQuery, UiLanguageQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UiLanguageQuery, UiLanguageQueryVariables>(UiLanguageDocument, options);
      }
export function useUiLanguageLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UiLanguageQuery, UiLanguageQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UiLanguageQuery, UiLanguageQueryVariables>(UiLanguageDocument, options);
        }
export type UiLanguageQueryHookResult = ReturnType<typeof useUiLanguageQuery>;
export type UiLanguageLazyQueryHookResult = ReturnType<typeof useUiLanguageLazyQuery>;
export type UiLanguageQueryResult = Apollo.QueryResult<UiLanguageQuery, UiLanguageQueryVariables>;