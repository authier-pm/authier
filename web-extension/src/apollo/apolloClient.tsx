import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getAccessToken } from '../util/accessTokenExtension'
import { errorLink } from '@shared/errorLink'
import { tokenRefresh } from './tokenRefresh'
import { API_URL } from './API_URL'

export const apolloCache = new InMemoryCache()

const httpLink = createHttpLink({
  uri: API_URL,
  credentials: 'include'
})

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
export const apolloClient = new ApolloClient({
  // Refresh depends on the device, which imports this client. Resolve that link
  // when a request starts, after the circular module initialization completes.
  link: ApolloLink.from([
    new ApolloLink((operation, forward) =>
      tokenRefresh.request(operation, forward)
    ),
    errorLink,
    authLink,
    httpLink
  ]),
  cache: apolloCache,
  queryDeduplication: true
})

export const apolloClientWithoutTokenRefresh = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
  cache: apolloCache,
  queryDeduplication: true
})
