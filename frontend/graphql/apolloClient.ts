import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  InMemoryCache
} from '@apollo/client'

import jwtDecode from 'jwt-decode'
import { onError } from '@apollo/client/link/error'

import { toast } from 'react-toastify'
import { print } from 'graphql'

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL

export const getTokenFromLocalStorage = async (): Promise<string | null> => {
  const accessToken = sessionStorage.getItem('access-token')
  return accessToken
}

export const getUserFromToken = async () => {
  return jwtDecode<{ userId: string }>(
    (await getTokenFromLocalStorage()) as string
  )
}

const httpLink = createHttpLink({
  uri: `${NEXT_PUBLIC_API_URL}/graphql`,
  credentials: 'include'
})

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  // const isExtension = window.location.href.startsWith('chrome-extension')

  if (graphQLErrors) {
    graphQLErrors.map(({ message, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, operation: ${operation.operationName}, Path: ${path}`
      )
      console.error('full operation: ', print(operation.query))
    })

    toast.error(graphQLErrors[0].message ?? 'There was API error.')
  } else if (networkError) {
    console.error(`[Network error]: ${networkError}`)
    toast.error('There was network error.')
  }
})

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  queryDeduplication: true
})
