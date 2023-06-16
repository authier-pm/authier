import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CreateCheckoutSessionVaultMutationVariables = Types.Exact<{
  product: Types.Scalars['String']['input'];
}>;


export type CreateCheckoutSessionVaultMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', createCheckoutSession: string } };


export const CreateCheckoutSessionVaultDocument = gql`
    mutation createCheckoutSessionVault($product: String!) {
  me {
    createCheckoutSession(product: $product)
  }
}
    `;
export type CreateCheckoutSessionVaultMutationFn = Apollo.MutationFunction<CreateCheckoutSessionVaultMutation, CreateCheckoutSessionVaultMutationVariables>;

/**
 * __useCreateCheckoutSessionVaultMutation__
 *
 * To run a mutation, you first call `useCreateCheckoutSessionVaultMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCheckoutSessionVaultMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCheckoutSessionVaultMutation, { data, loading, error }] = useCreateCheckoutSessionVaultMutation({
 *   variables: {
 *      product: // value for 'product'
 *   },
 * });
 */
export function useCreateCheckoutSessionVaultMutation(baseOptions?: Apollo.MutationHookOptions<CreateCheckoutSessionVaultMutation, CreateCheckoutSessionVaultMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCheckoutSessionVaultMutation, CreateCheckoutSessionVaultMutationVariables>(CreateCheckoutSessionVaultDocument, options);
      }
export type CreateCheckoutSessionVaultMutationHookResult = ReturnType<typeof useCreateCheckoutSessionVaultMutation>;
export type CreateCheckoutSessionVaultMutationResult = Apollo.MutationResult<CreateCheckoutSessionVaultMutation>;
export type CreateCheckoutSessionVaultMutationOptions = Apollo.BaseMutationOptions<CreateCheckoutSessionVaultMutation, CreateCheckoutSessionVaultMutationVariables>;