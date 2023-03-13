import { onError } from '@apollo/client/link/error'
import { ApolloClient, InMemoryCache, from, HttpLink } from '@apollo/client'
import { RetryLink } from 'apollo-link-retry'

import SerializingLink from 'apollo-link-serialize'
import QueueLink from 'apollo-link-queue'

import { setContext } from '@apollo/client/link/context'
import { accessToken } from '../utils/tokenFromAsyncStorage'
import { tokenRefresh } from './tokenRefresh'
import { device } from '../utils/Device'
import { API_URL, API_URL_RELEASE } from '@env'

//REVERSE PORTS adb reverse tcp:5051 tcp:5051 or use https://stackoverflow.com/a/2235255/671457
const apiUrl = __DEV__ ? API_URL : API_URL_RELEASE
console.log('apiUrl:', apiUrl)
const httpLink = new HttpLink({
  uri: apiUrl,
  credentials: 'include'
})

const retryLink = new RetryLink()
export const queueLink = new QueueLink()
const serializingLink = new SerializingLink()

const authLink = setContext(async (_, { headers }) => {
  //get the authentication token

  //return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `bearer ${accessToken}` : ''
    }
  }
})

// Log any GraphQL errors or network error that occurred
const errorLink = onError(({ graphQLErrors, networkError, response }) => {
  if (graphQLErrors) {
    if (graphQLErrors[0].message === 'not authenticated') {
      //Here just logout the user
      device.clearAndReload()
    }
    graphQLErrors.map(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    )
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
    console.error(response)
  }
})

export const cache = new InMemoryCache()

export const apolloClient = new ApolloClient({
  link: from([
    tokenRefresh,
    errorLink,
    queueLink,
    serializingLink,
    retryLink,
    authLink,
    httpLink as any
  ]),
  cache: cache
})
