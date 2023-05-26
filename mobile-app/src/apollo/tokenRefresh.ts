import { accessToken, saveAccessToken } from '../utils/tokenFromAsyncStorage'
import { TokenRefreshLink } from 'apollo-link-token-refresh'
import jwtDecode, { JwtPayload } from 'jwt-decode'
import { API_URL, API_URL_RELEASE } from '@env'
import { useStore } from '@src/utils/deviceStore'

const ENDPOINT = __DEV__ ? API_URL : API_URL_RELEASE
if (!ENDPOINT) {
  throw new Error('API_URL is not defined')
}

export const tokenRefresh = new TokenRefreshLink({
  accessTokenField: 'accessToken',
  isTokenValidOrUndefined: () => {
    if (!accessToken) {
      return false
    }

    try {
      const { exp } = jwtDecode<JwtPayload & { exp: number }>(accessToken)
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
    return await fetch(`${ENDPOINT.replace('/graphql', '')}/refresh_token`, {
      method: 'POST',
      credentials: 'include'
    })
  },
  handleFetch: async (newAccessToken) => {
    saveAccessToken(newAccessToken)
  },
  handleError: async (err) => {
    //FIX: What should we do here?
    if (useStore.getState().isLoggedIn) {
      console.warn('Your refresh token is invalid. You must login again', err)
      useStore.getState().clearAndReload()
    }
  }
})
