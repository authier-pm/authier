import * as Types from '../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CreateCheckoutSessionMutationVariables = Types.Exact<{
  product: Types.Scalars['String'];
}>;


export type CreateCheckoutSessionMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', createCheckoutSession: string } };

export type CreatePortalSessionMutationVariables = Types.Exact<{ [key: string]: never; }>;


export type CreatePortalSessionMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', createPortalSession: string } };


export const CreateCheckoutSessionDocument = gql`
    mutation createCheckoutSession($product: String!) {
  me {
    createCheckoutSession(product: $product)
  }
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
export const CreatePortalSessionDocument = gql`
    mutation createPortalSession {
  me {
    createPortalSession
  }
}
    `;
export type CreatePortalSessionMutationFn = Apollo.MutationFunction<CreatePortalSessionMutation, CreatePortalSessionMutationVariables>;

/**
 * __useCreatePortalSessionMutation__
 *
 * To run a mutation, you first call `useCreatePortalSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePortalSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPortalSessionMutation, { data, loading, error }] = useCreatePortalSessionMutation({
 *   variables: {
 *   },
 * });
 */
export function useCreatePortalSessionMutation(baseOptions?: Apollo.MutationHookOptions<CreatePortalSessionMutation, CreatePortalSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreatePortalSessionMutation, CreatePortalSessionMutationVariables>(CreatePortalSessionDocument, options);
      }
export type CreatePortalSessionMutationHookResult = ReturnType<typeof useCreatePortalSessionMutation>;
export type CreatePortalSessionMutationResult = Apollo.MutationResult<CreatePortalSessionMutation>;
export type CreatePortalSessionMutationOptions = Apollo.BaseMutationOptions<CreatePortalSessionMutation, CreatePortalSessionMutationVariables>;