import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  InMemoryCache
} from '@apollo/client'
import { errorLink } from '../../shared/errorLink'

import { TokenRefreshLink } from 'apollo-link-token-refresh'
import jwtDecode from 'jwt-decode'

export let accessToken = ''
export let getTokenFromLocalStorage = async (): Promise<string | null> => {
  return sessionStorage.getItem('access-token')
}

export const setAccessToken = (s: string) => {
  accessToken = s
}

export const removeToken = () => {
  accessToken = ''
}

export const getAccessToken = () => {
  return accessToken
}

export const getUserFromToken = async () => {
  return jwtDecode<{ userId: string }>(
    (await getTokenFromLocalStorage()) as string
  )
}
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL

export const tokenRefresh = new TokenRefreshLink({
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
    console.log('refetch JWT access token')
    return await fetch(`${NEXT_PUBLIC_API_URL}/refresh_token`, {
      method: 'POST',
      credentials: 'include'
    })
  },
  handleFetch: async (accessToken) => {
    await sessionStorage.setItem('access-token', accessToken)
    setAccessToken(accessToken)
  },
  handleError: (err) => {
    console.warn('Your refresh token is invalid. Try to login again', err)
  }
})

const httpLink = createHttpLink({
  uri: `${NEXT_PUBLIC_API_URL}/graphql`
})

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([tokenRefresh, errorLink, httpLink]),
  cache: new InMemoryCache(),
  queryDeduplication: true
})
