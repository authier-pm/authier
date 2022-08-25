import { accessToken, saveAccessToken } from '../utils/tokenFromAsyncStorage'
import { TokenRefreshLink } from 'apollo-link-token-refresh'
import jwtDecode, { JwtPayload } from 'jwt-decode'
import Config from 'react-native-config'
import mitt from 'mitt'
import { device } from '@src/utils/Device'

const ENDPOINT = __DEV__ ? Config.API_URL : Config.API_URL_RELEASE

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
  handleFetch: async (accessToken) => {
    saveAccessToken(accessToken)
  },
  handleError: async (err) => {
    // TODO: What should we do here?
    if (device.state) {
      let emitter = mitt()
      console.warn('Your refresh token is invalid. You must login again', err)

      await device.clearAndReload()
      emitter.emit('stateChange')
    }
  }
})
