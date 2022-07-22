import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type MeExtensionQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type MeExtensionQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, encryptedSecrets: Array<{ __typename?: 'EncryptedSecretQuery', kind: Types.EncryptedSecretType }> } };

export type CreateCheckoutSessionMutationVariables = Types.Exact<{
  product: Types.Scalars['String'];
}>;


export type CreateCheckoutSessionMutation = { __typename?: 'Mutation', createCheckoutSession: string };


export const MeExtensionDocument = gql`
    query meExtension {
  me {
    id
    encryptedSecrets {
      kind
    }
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
export const CreateCheckoutSessionDocument = gql`
    mutation createCheckoutSession($product: String!) {
  createCheckoutSession(product: $product)
}
    `;
export type CreateCheckoutSessionMutationFn = Apollo.MutationFunction<CreateCheckoutSessionMutation, CreateCheckoutSessionMutationVariables>;

/**
 * __useCreateCheckoutSessionMutation__
 *
 * To run a mutation, you first call `useCreateCheckoutSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCheckoutSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCheckoutSessionMutation, { data, loading, error }] = useCreateCheckoutSessionMutation({
 *   variables: {
 *      product: // value for 'product'
 *   },
 * });
 */
export function useCreateCheckoutSessionMutation(baseOptions?: Apollo.MutationHookOptions<CreateCheckoutSessionMutation, CreateCheckoutSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCheckoutSessionMutation, CreateCheckoutSessionMutationVariables>(CreateCheckoutSessionDocument, options);
      }
export type CreateCheckoutSessionMutationHookResult = ReturnType<typeof useCreateCheckoutSessionMutation>;
export type CreateCheckoutSessionMutationResult = Apollo.MutationResult<CreateCheckoutSessionMutation>;
export type CreateCheckoutSessionMutationOptions = Apollo.BaseMutationOptions<CreateCheckoutSessionMutation, CreateCheckoutSessionMutationVariables>;