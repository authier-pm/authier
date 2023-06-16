import { TokenRefreshLink } from 'apollo-link-token-refresh'
import jwtDecode, { JwtPayload } from 'jwt-decode'
import { API_URL } from '@env'
import { useDeviceStore } from '@src/utils/deviceStore'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'

if (!API_URL) {
  throw new Error('API_URL is not defined')
}

export const tokenRefresh = new TokenRefreshLink({
  accessTokenField: 'accessToken',
  isTokenValidOrUndefined: async () => {
    let accessToken = useDeviceStateStore.getState().accessToken
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
    return await fetch(`${API_URL.replace('/graphql', '')}/refresh_token`, {
      method: 'POST',
      credentials: 'include'
    })
  },
  handleFetch: async (newAccessToken) => {
    useDeviceStateStore.setState({ accessToken: newAccessToken })
  },
  handleError: async (err) => {
    if (err.message.includes('not authenticated')) {
      console.warn(
        'Your refresh token is invalid. You must login again',
        err.message
      )
      useDeviceStore.getState().clearAndReload()
    }
  }
})
