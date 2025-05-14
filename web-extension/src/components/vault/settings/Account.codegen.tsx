import * as Types from '../../../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ChangeMasterPasswordMutationVariables = Types.Exact<{
  secrets: Array<Types.EncryptedSecretPatchInput> | Types.EncryptedSecretPatchInput;
  addDeviceSecret: Types.Scalars['NonEmptyString']['input'];
  addDeviceSecretEncrypted: Types.Scalars['NonEmptyString']['input'];
  decryptionChallengeId: Types.Scalars['PositiveInt']['input'];
}>;


export type ChangeMasterPasswordMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', changeMasterPassword: number } };

export type AccountQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type AccountQuery = { __typename?: 'Query', me: { __typename?: 'UserQuery', id: string, deviceRecoveryCooldownMinutes: number, primaryEmailVerification?: { __typename?: 'EmailVerificationGQLScalars', createdAt: string, verifiedAt?: string | null } | null } };

export type ResendEmailVerificationMutationVariables = Types.Exact<{ [key: string]: never; }>;


export type ResendEmailVerificationMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', sendEmailVerification: number } };

export type DeleteAccountMutationVariables = Types.Exact<{ [key: string]: never; }>;


export type DeleteAccountMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', delete: { __typename?: 'UserGQL', id: string } } };


export const ChangeMasterPasswordDocument = gql`
    mutation changeMasterPassword($secrets: [EncryptedSecretPatchInput!]!, $addDeviceSecret: NonEmptyString!, $addDeviceSecretEncrypted: NonEmptyString!, $decryptionChallengeId: PositiveInt!) {
  me {
    changeMasterPassword(
      input: {secrets: $secrets, addDeviceSecret: $addDeviceSecret, addDeviceSecretEncrypted: $addDeviceSecretEncrypted, decryptionChallengeId: $decryptionChallengeId}
    )
  }
}
    `;
export type ChangeMasterPasswordMutationFn = Apollo.MutationFunction<ChangeMasterPasswordMutation, ChangeMasterPasswordMutationVariables>;

/**
 * __useChangeMasterPasswordMutation__
 *
 * To run a mutation, you first call `useChangeMasterPasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangeMasterPasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changeMasterPasswordMutation, { data, loading, error }] = useChangeMasterPasswordMutation({
 *   variables: {
 *      secrets: // value for 'secrets'
 *      addDeviceSecret: // value for 'addDeviceSecret'
 *      addDeviceSecretEncrypted: // value for 'addDeviceSecretEncrypted'
 *      decryptionChallengeId: // value for 'decryptionChallengeId'
 *   },
 * });
 */
export function useChangeMasterPasswordMutation(baseOptions?: Apollo.MutationHookOptions<ChangeMasterPasswordMutation, ChangeMasterPasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ChangeMasterPasswordMutation, ChangeMasterPasswordMutationVariables>(ChangeMasterPasswordDocument, options);
      }
export type ChangeMasterPasswordMutationHookResult = ReturnType<typeof useChangeMasterPasswordMutation>;
export type ChangeMasterPasswordMutationResult = Apollo.MutationResult<ChangeMasterPasswordMutation>;
export type ChangeMasterPasswordMutationOptions = Apollo.BaseMutationOptions<ChangeMasterPasswordMutation, ChangeMasterPasswordMutationVariables>;
export const AccountDocument = gql`
    query Account {
  me {
    id
    deviceRecoveryCooldownMinutes
    primaryEmailVerification {
      createdAt
      verifiedAt
    }
  }
}
    `;

/**
 * __useAccountQuery__
 *
 * To run a query within a React component, call `useAccountQuery` and pass it any options that fit your needs.
 * When your component renders, `useAccountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAccountQuery({
 *   variables: {
 *   },
 * });
 */
export function useAccountQuery(baseOptions?: Apollo.QueryHookOptions<AccountQuery, AccountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AccountQuery, AccountQueryVariables>(AccountDocument, options);
      }
export function useAccountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AccountQuery, AccountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AccountQuery, AccountQueryVariables>(AccountDocument, options);
        }
export function useAccountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AccountQuery, AccountQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<AccountQuery, AccountQueryVariables>(AccountDocument, options);
        }
export type AccountQueryHookResult = ReturnType<typeof useAccountQuery>;
export type AccountLazyQueryHookResult = ReturnType<typeof useAccountLazyQuery>;
export type AccountSuspenseQueryHookResult = ReturnType<typeof useAccountSuspenseQuery>;
export type AccountQueryResult = Apollo.QueryResult<AccountQuery, AccountQueryVariables>;
export const ResendEmailVerificationDocument = gql`
    mutation resendEmailVerification {
  me {
    sendEmailVerification
  }
}
    `;
export type ResendEmailVerificationMutationFn = Apollo.MutationFunction<ResendEmailVerificationMutation, ResendEmailVerificationMutationVariables>;

/**
 * __useResendEmailVerificationMutation__
 *
 * To run a mutation, you first call `useResendEmailVerificationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResendEmailVerificationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resendEmailVerificationMutation, { data, loading, error }] = useResendEmailVerificationMutation({
 *   variables: {
 *   },
 * });
 */
export function useResendEmailVerificationMutation(baseOptions?: Apollo.MutationHookOptions<ResendEmailVerificationMutation, ResendEmailVerificationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ResendEmailVerificationMutation, ResendEmailVerificationMutationVariables>(ResendEmailVerificationDocument, options);
      }
export type ResendEmailVerificationMutationHookResult = ReturnType<typeof useResendEmailVerificationMutation>;
export type ResendEmailVerificationMutationResult = Apollo.MutationResult<ResendEmailVerificationMutation>;
export type ResendEmailVerificationMutationOptions = Apollo.BaseMutationOptions<ResendEmailVerificationMutation, ResendEmailVerificationMutationVariables>;
export const DeleteAccountDocument = gql`
    mutation deleteAccount {
  me {
    delete {
      id
    }
  }
}
    `;
export type DeleteAccountMutationFn = Apollo.MutationFunction<DeleteAccountMutation, DeleteAccountMutationVariables>;

/**
 * __useDeleteAccountMutation__
 *
 * To run a mutation, you first call `useDeleteAccountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAccountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAccountMutation, { data, loading, error }] = useDeleteAccountMutation({
 *   variables: {
 *   },
 * });
 */
export function useDeleteAccountMutation(baseOptions?: Apollo.MutationHookOptions<DeleteAccountMutation, DeleteAccountMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteAccountMutation, DeleteAccountMutationVariables>(DeleteAccountDocument, options);
      }
export type DeleteAccountMutationHookResult = ReturnType<typeof useDeleteAccountMutation>;
export type DeleteAccountMutationResult = Apollo.MutationResult<DeleteAccountMutation>;
export type DeleteAccountMutationOptions = Apollo.BaseMutationOptions<DeleteAccountMutation, DeleteAccountMutationVariables>;