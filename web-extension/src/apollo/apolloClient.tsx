import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getTokenFromLocalStorage } from '../util/accessTokenExtension'
import { errorLink } from '../../../shared/errorLink'
import { tokenRefresh } from './tokenRefresh'

export const API_URL = process.env.API_URL

const httpLink = createHttpLink({
  uri: API_URL,
  credentials: 'include'
})
const authLink = setContext(async (_, { headers }) => {
  //get the authentication token
  const accessToken = await getTokenFromLocalStorage() //<=== choose what to use??
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
  cache: new InMemoryCache(),
  queryDeduplication: true
})
