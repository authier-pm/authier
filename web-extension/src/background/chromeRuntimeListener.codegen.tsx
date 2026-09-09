/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import * as Types from '@shared/generated/graphqlBaseTypes';

import { WebInputType } from '@shared/generated/graphqlBaseTypes';
import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type WebInputElement = {
  /** The index of the input element on the page (0-based). We are not able to always generate a css selector which matches only one element. Here the domOrdinal comes in and saves the day. */
  domOrdinal: number;
  domPath: string;
  kind: WebInputType;
  url: string;
};

export { WebInputType };

export type AddWebInputsMutationVariables = Exact<{
  webInputs: Array<Types.WebInputElement> | Types.WebInputElement;
}>;


export type AddWebInputsMutation = { addWebInputs: Array<{ id: number, createdAt: string, formClassification: unknown }> };

export type ClassifyPasswordFormMutationVariables = Exact<{
  input: unknown;
}>;


export type ClassifyPasswordFormMutation = { classifyPasswordForm: { id: number, host: string, url: string, domPath: string, domOrdinal: number, kind: Types.WebInputType, createdAt: string, formClassification: unknown } | null };

export type WebInputsForHostsQueryVariables = Exact<{
  hosts?: Array<string> | string | null | undefined;
}>;


export type WebInputsForHostsQuery = { webInputs: Array<{ id: number, host: string, url: string, domPath: string, domOrdinal: number, kind: Types.WebInputType, createdAt: string, formClassification: unknown }> };


export const AddWebInputsDocument = gql`
    mutation addWebInputs($webInputs: [WebInputElement!]!) {
  addWebInputs(webInputs: $webInputs) {
    id
    createdAt
    formClassification
  }
}
    `;

/**
 * __useAddWebInputsMutation__
 *
 * To run a mutation, you first call `useAddWebInputsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddWebInputsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addWebInputsMutation, { data, loading, error }] = useAddWebInputsMutation({
 *   variables: {
 *      webInputs: // value for 'webInputs'
 *   },
 * });
 */
export function useAddWebInputsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<AddWebInputsMutation, AddWebInputsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<AddWebInputsMutation, AddWebInputsMutationVariables>(AddWebInputsDocument, options);
      }
export type AddWebInputsMutationHookResult = ReturnType<typeof useAddWebInputsMutation>;
export type AddWebInputsMutationResult = ApolloReactCommon.MutationResult<AddWebInputsMutation>;
export const ClassifyPasswordFormDocument = gql`
    mutation classifyPasswordForm($input: JSON!) {
  classifyPasswordForm(input: $input) {
    id
    host
    url
    domPath
    domOrdinal
    kind
    createdAt
    formClassification
  }
}
    `;

/**
 * __useClassifyPasswordFormMutation__
 *
 * To run a mutation, you first call `useClassifyPasswordFormMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useClassifyPasswordFormMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [classifyPasswordFormMutation, { data, loading, error }] = useClassifyPasswordFormMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useClassifyPasswordFormMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ClassifyPasswordFormMutation, ClassifyPasswordFormMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ClassifyPasswordFormMutation, ClassifyPasswordFormMutationVariables>(ClassifyPasswordFormDocument, options);
      }
export type ClassifyPasswordFormMutationHookResult = ReturnType<typeof useClassifyPasswordFormMutation>;
export type ClassifyPasswordFormMutationResult = ApolloReactCommon.MutationResult<ClassifyPasswordFormMutation>;
export const WebInputsForHostsDocument = gql`
    query webInputsForHosts($hosts: [String!]) {
  webInputs(hosts: $hosts) {
    id
    host
    url
    domPath
    domOrdinal
    kind
    createdAt
    formClassification
  }
}
    `;

/**
 * __useWebInputsForHostsQuery__
 *
 * To run a query within a React component, call `useWebInputsForHostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useWebInputsForHostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWebInputsForHostsQuery({
 *   variables: {
 *      hosts: // value for 'hosts'
 *   },
 * });
 */
export function useWebInputsForHostsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<WebInputsForHostsQuery, WebInputsForHostsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<WebInputsForHostsQuery, WebInputsForHostsQueryVariables>(WebInputsForHostsDocument, options);
      }
export function useWebInputsForHostsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<WebInputsForHostsQuery, WebInputsForHostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<WebInputsForHostsQuery, WebInputsForHostsQueryVariables>(WebInputsForHostsDocument, options);
        }
// @ts-ignore
export function useWebInputsForHostsSuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<WebInputsForHostsQuery, WebInputsForHostsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<WebInputsForHostsQuery, WebInputsForHostsQueryVariables>;
// @ts-ignore
export function useWebInputsForHostsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<WebInputsForHostsQuery, WebInputsForHostsQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<WebInputsForHostsQuery | undefined, WebInputsForHostsQueryVariables>;
export function useWebInputsForHostsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<WebInputsForHostsQuery, WebInputsForHostsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<WebInputsForHostsQuery, WebInputsForHostsQueryVariables>(WebInputsForHostsDocument, options);
        }
export type WebInputsForHostsQueryHookResult = ReturnType<typeof useWebInputsForHostsQuery>;
export type WebInputsForHostsLazyQueryHookResult = ReturnType<typeof useWebInputsForHostsLazyQuery>;
export type WebInputsForHostsSuspenseQueryHookResult = ReturnType<typeof useWebInputsForHostsSuspenseQuery>;
export type WebInputsForHostsQueryResult = ApolloReactCommon.QueryResult<WebInputsForHostsQuery, WebInputsForHostsQueryVariables>;