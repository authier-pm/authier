import * as Types from '../../../shared/generated/graphqlBaseTypes'

import { gql } from '@apollo/client'
import * as Apollo from '@apollo/client'
const defaultOptions = {}
export type MyDevicesQueryVariables = Types.Exact<{ [key: string]: never }>

export type MyDevicesQuery = {
  __typename?: 'Query'
  me?:
    | {
        __typename?: 'UserQuery'
        myDevices: Array<{
          __typename?: 'Device'
          id: number
          firstIpAddress: string
          lastIpAddress: string
          name: string
        }>
      }
    | null
    | undefined
}

export const MyDevicesDocument = gql`
  query myDevices {
    me {
      myDevices {
        id
        firstIpAddress
        lastIpAddress
        name
      }
    }
  }
`

/**
 * __useMyDevicesQuery__
 *
 * To run a query within a React component, call `useMyDevicesQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyDevicesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyDevicesQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyDevicesQuery(
  baseOptions?: Apollo.QueryHookOptions<MyDevicesQuery, MyDevicesQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<MyDevicesQuery, MyDevicesQueryVariables>(
    MyDevicesDocument,
    options
  )
}
export function useMyDevicesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    MyDevicesQuery,
    MyDevicesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<MyDevicesQuery, MyDevicesQueryVariables>(
    MyDevicesDocument,
    options
  )
}
export type MyDevicesQueryHookResult = ReturnType<typeof useMyDevicesQuery>
export type MyDevicesLazyQueryHookResult = ReturnType<
  typeof useMyDevicesLazyQuery
>
export type MyDevicesQueryResult = Apollo.QueryResult<
  MyDevicesQuery,
  MyDevicesQueryVariables
>
