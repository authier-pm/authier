import { onError } from '@apollo/client/link/error'
import { ApolloClient, InMemoryCache, from } from '@apollo/client'
import { RetryLink } from 'apollo-link-retry'
import { createHttpLink } from 'apollo-link-http'
import SerializingLink from 'apollo-link-serialize'
import QueueLink from 'apollo-link-queue'
import Config from 'react-native-config'
import { setContext } from '@apollo/client/link/context'
import { getAccessToken } from '../utils/tokenFromAsyncStorage'
import { tokenRefresh } from './tokenRefresh'
import { device } from '../utils/Device'

//REVERSE PORTS adb reverse tcp:5051 tcp:5051
const httpLink = createHttpLink({
  uri: __DEV__ ? 'http://10.0.2.2:5051/graphql' : Config.API_URL_RELEASE,
  credentials: 'include'
})
console.log('~ Config.API_URL', Config.API_URL)

const retryLink = new RetryLink()
export const queueLink = new QueueLink()
const serializingLink = new SerializingLink()

const authLink = setContext(async (_, { headers }) => {
  //get the authentication token
  const accessToken = await getAccessToken()

  //return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `bearer ${accessToken}` : ''
    }
  }
})

// Log any GraphQL errors or network error that occurred
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    if (graphQLErrors[0].message === 'not authenticated') {
      //Here just logout the user
      device.clearAndReload()
    }
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    )
  }
  if (networkError) {
    console.log(`[Network error]: ${networkError}`)
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
