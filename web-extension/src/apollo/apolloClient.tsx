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
import SerializingLink from 'apollo-link-serialize'

export const API_URL = process.env.API_URL

const httpLink = createHttpLink({
  uri: API_URL,
  credentials: 'include'
})

const serializingLink = new SerializingLink()

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
  link: ApolloLink.from([
    tokenRefresh,
    errorLink,
    serializingLink,
    authLink,
    httpLink
  ]),
  cache: new InMemoryCache(),
  queryDeduplication: true
})
