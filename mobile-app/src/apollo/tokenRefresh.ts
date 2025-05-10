import { TokenRefreshLink } from 'apollo-link-token-refresh'
import { JwtPayload, jwtDecode } from 'jwt-decode'
import { useDeviceStateStore } from '../utils/deviceStateStore'
import { useDeviceStore } from '../utils/deviceStore'

const API_URL = process.env.EXPO_PUBLIC_API_URL
if (!API_URL) {
  throw new Error('API_URL is not defined')
}

export const tokenRefresh = new TokenRefreshLink({
  accessTokenField: 'accessToken',
  isTokenValidOrUndefined: async () => {
    const accessToken = useDeviceStateStore.getState().accessToken
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
      console.error('error:', error)
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
      console.log(
        'Your refresh token is invalid. You must login again',
        err.message
      )
      useDeviceStore.getState().clearAndReload()
    }
  }
})
