import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getTokenFromLocalStorage } from '../util/accessTokenExtension'
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
  const accessToken = await getTokenFromLocalStorage()

  //return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `bearer ${accessToken}` : ''
    }
  }
})
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([tokenRefresh, errorLink, authLink, httpLink]),
  cache: apolloCache,
  queryDeduplication: true
})

export const apolloClientWithoutTokenRefresh = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
  cache: apolloCache,
  queryDeduplication: true
})
