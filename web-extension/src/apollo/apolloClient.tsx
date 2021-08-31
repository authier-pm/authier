import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import {
  getAccessToken,
  setAccessToken,
  tokenFromLocalStorage
} from '../util/accessToken'
import { TokenRefreshLink } from 'apollo-link-token-refresh'
import jwtDecode from 'jwt-decode'
import { browser } from 'webextension-polyfill-ts'
import { errorLink } from '../../../shared/errorLink'

const API_URL = process.env.API_URL

const httpLink = createHttpLink({
  uri: API_URL
})
const tokenRefresh = new TokenRefreshLink({
  accessTokenField: 'accessToken',
  isTokenValidOrUndefined: () => {
    //Get token from local storage
    const token = getAccessToken()

    if (!token) {
      return true
    }

    try {
      // @ts-expect-error
      const { exp } = jwtDecode(token)
      if (Date.now() >= exp * 1000) {
        return false
      } else {
        return true
      }
    } catch (error) {
      return false
    }
  },
  fetchAccessToken: async () => {
    console.log('refetch JWT token')
    return await fetch(`${API_URL}/refresh_token`, {
      method: 'POST',
      credentials: 'include'
    })
  },
  handleFetch: async (accessToken) => {
    await browser.storage.local.set({ jid: accessToken })
    setAccessToken(accessToken)
  },
  handleError: (err) => {
    console.warn('Your refresh token is invalid. Try to login again', err)
  }
})
const authLink = setContext(async (_, { headers }) => {
  //get the authentication token
  const accessToken = await tokenFromLocalStorage() //<=== choose what to use??
  //return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `bearer ${accessToken}` : ''
    }
  }
})
export const apolloClient = new ApolloClient({
  // @ts-expect-error
  link: ApolloLink.from([tokenRefresh, errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  queryDeduplication: true
})
