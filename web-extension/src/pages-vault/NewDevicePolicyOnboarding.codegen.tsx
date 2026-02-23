import * as Types from '@shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;
export type UpdateNewDevicePolicyMutationVariables = Types.Exact<{
  newDevicePolicy: Types.UserNewDevicePolicy;
}>;


export type UpdateNewDevicePolicyMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', setNewDevicePolicy: { __typename?: 'UserGQL', id: string, newDevicePolicy?: Types.UserNewDevicePolicy | null } } };

export type GetUserNewDevicePolicyQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type GetUserNewDevicePolicyQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, newDevicePolicy?: Types.UserNewDevicePolicy | null } };


export const UpdateNewDevicePolicyDocument = gql`
    mutation UpdateNewDevicePolicy($newDevicePolicy: UserNewDevicePolicy!) {
  me {
    setNewDevicePolicy(newDevicePolicy: $newDevicePolicy) {
      id
      newDevicePolicy
    }
  }
}
    `;

/**
 * __useUpdateNewDevicePolicyMutation__
 *
 * To run a mutation, you first call `useUpdateNewDevicePolicyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNewDevicePolicyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNewDevicePolicyMutation, { data, loading, error }] = useUpdateNewDevicePolicyMutation({
 *   variables: {
 *      newDevicePolicy: // value for 'newDevicePolicy'
 *   },
 * });
 */
export function useUpdateNewDevicePolicyMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateNewDevicePolicyMutation, UpdateNewDevicePolicyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateNewDevicePolicyMutation, UpdateNewDevicePolicyMutationVariables>(UpdateNewDevicePolicyDocument, options);
      }
export type UpdateNewDevicePolicyMutationHookResult = ReturnType<typeof useUpdateNewDevicePolicyMutation>;
export type UpdateNewDevicePolicyMutationResult = ApolloReactCommon.MutationResult<UpdateNewDevicePolicyMutation>;
export const GetUserNewDevicePolicyDocument = gql`
    query GetUserNewDevicePolicy {
  me {
    id
    newDevicePolicy
  }
}
    `;

/**
 * __useGetUserNewDevicePolicyQuery__
 *
 * To run a query within a React component, call `useGetUserNewDevicePolicyQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserNewDevicePolicyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserNewDevicePolicyQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetUserNewDevicePolicyQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetUserNewDevicePolicyQuery, GetUserNewDevicePolicyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserNewDevicePolicyQuery, GetUserNewDevicePolicyQueryVariables>(GetUserNewDevicePolicyDocument, options);
      }
export function useGetUserNewDevicePolicyLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserNewDevicePolicyQuery, GetUserNewDevicePolicyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserNewDevicePolicyQuery, GetUserNewDevicePolicyQueryVariables>(GetUserNewDevicePolicyDocument, options);
        }
// @ts-ignore
export function useGetUserNewDevicePolicySuspenseQuery(baseOptions?: ApolloReactHooks.SuspenseQueryHookOptions<GetUserNewDevicePolicyQuery, GetUserNewDevicePolicyQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserNewDevicePolicyQuery, GetUserNewDevicePolicyQueryVariables>;
// @ts-ignore
export function useGetUserNewDevicePolicySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserNewDevicePolicyQuery, GetUserNewDevicePolicyQueryVariables>): ApolloReactHooks.UseSuspenseQueryResult<GetUserNewDevicePolicyQuery | undefined, GetUserNewDevicePolicyQueryVariables>;
export function useGetUserNewDevicePolicySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserNewDevicePolicyQuery, GetUserNewDevicePolicyQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserNewDevicePolicyQuery, GetUserNewDevicePolicyQueryVariables>(GetUserNewDevicePolicyDocument, options);
        }
export type GetUserNewDevicePolicyQueryHookResult = ReturnType<typeof useGetUserNewDevicePolicyQuery>;
export type GetUserNewDevicePolicyLazyQueryHookResult = ReturnType<typeof useGetUserNewDevicePolicyLazyQuery>;
export type GetUserNewDevicePolicySuspenseQueryHookResult = ReturnType<typeof useGetUserNewDevicePolicySuspenseQuery>;
export type GetUserNewDevicePolicyQueryResult = ApolloReactCommon.QueryResult<GetUserNewDevicePolicyQuery, GetUserNewDevicePolicyQueryVariables>;