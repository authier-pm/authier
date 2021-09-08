import { getAccessToken, setAccessToken } from '../util/accessTokenExtension'
import { TokenRefreshLink } from 'apollo-link-token-refresh'
import jwtDecode from 'jwt-decode'
import browser from 'webextension-polyfill'
import { API_URL } from './apolloClient'

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
    return await fetch(`${API_URL}/refresh_token`, {
      method: 'POST',
      credentials: 'include'
    })
  },
  handleFetch: async (accessToken) => {
    await browser.storage.local.set({ 'access-token': accessToken })
    setAccessToken(accessToken)
  },
  handleError: (err) => {
    console.warn('Your refresh token is invalid. Try to login again', err)
  }
})
