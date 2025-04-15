import { accessToken, setAccessToken } from '../util/accessTokenExtension'
import { TokenRefreshLink } from 'apollo-link-token-refresh'
import { JwtPayload, jwtDecode } from 'jwt-decode'
import { API_URL } from './API_URL'
import { device } from '@src/background/ExtensionDevice'
const tokenRefreshBaseUrl = API_URL?.replace('/graphql', '')

export const tokenRefresh = new TokenRefreshLink({
  accessTokenField: 'accessToken',
  isTokenValidOrUndefined: async () => {
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
      console.error(error)
      return false
    }
  },
  fetchAccessToken: async () => {
    const url = `${tokenRefreshBaseUrl}/refresh_token`

    return await fetch(url, {
      method: 'POST',
      credentials: 'include'
    })
  },
  handleFetch: async (accessToken: string) => {
    // accessToken is the string token extracted by the library
    setAccessToken(accessToken)
  },
  handleError: async (err: any) => {
    console.error('Error during token refresh:', err)
    console.log('Your refresh token is likely invalid. Logging out.')

    await device.clearAndReload()
  }
})
