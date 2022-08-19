import { accessToken, saveAccessToken } from '../utils/tokenFromAsyncStorage'
import { TokenRefreshLink } from 'apollo-link-token-refresh'
import jwtDecode, { JwtPayload } from 'jwt-decode'
import Config from 'react-native-config'

export const tokenRefresh = new TokenRefreshLink({
  accessTokenField: 'accessToken',
  isTokenValidOrUndefined: () => {
    //Get token from local storage

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
    console.log('refetch JWT access token')

    return await fetch(
      `${Config.API_URL?.replace('/graphql', '')}/refresh_token`,
      {
        method: 'POST',
        credentials: 'include'
      }
    )
  },
  handleFetch: async (accessToken) => {
    console.log('handleFetch', accessToken)
    saveAccessToken(accessToken)
  }
})
