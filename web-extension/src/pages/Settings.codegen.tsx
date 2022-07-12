import * as Types from '../../../shared/generated/graphqlBaseTypes';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type UpdateSettingsMutationVariables = Types.Exact<{
  autofill: Types.Scalars['Boolean'];
  lockTime: Types.Scalars['Int'];
  language: Types.Scalars['String'];
  twoFA: Types.Scalars['Boolean'];
}>;


export type UpdateSettingsMutation = { __typename?: 'Mutation', me: { __typename?: 'UserMutation', updateSettings: { __typename?: 'SettingsConfigGQL', userId: string } } };


export const UpdateSettingsDocument = gql`
    mutation updateSettings($autofill: Boolean!, $lockTime: Int!, $language: String!, $twoFA: Boolean!) {
  me {
    updateSettings(
      autofill: $autofill
      lockTime: $lockTime
      language: $language
      twoFA: $twoFA
    ) {
      userId
    }
  }
}
    `;
export type UpdateSettingsMutationFn = Apollo.MutationFunction<UpdateSettingsMutation, UpdateSettingsMutationVariables>;

/**
 * __useUpdateSettingsMutation__
 *
 * To run a mutation, you first call `useUpdateSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSettingsMutation, { data, loading, error }] = useUpdateSettingsMutation({
 *   variables: {
 *      autofill: // value for 'autofill'
 *      lockTime: // value for 'lockTime'
 *      language: // value for 'language'
 *      twoFA: // value for 'twoFA'
 *   },
 * });
 */
export function useUpdateSettingsMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSettingsMutation, UpdateSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSettingsMutation, UpdateSettingsMutationVariables>(UpdateSettingsDocument, options);
      }
export type UpdateSettingsMutationHookResult = ReturnType<typeof useUpdateSettingsMutation>;
export type UpdateSettingsMutationResult = Apollo.MutationResult<UpdateSettingsMutation>;
export type UpdateSettingsMutationOptions = Apollo.BaseMutationOptions<UpdateSettingsMutation, UpdateSettingsMutationVariables>;