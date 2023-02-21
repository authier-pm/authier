import {
  accessToken,
  removeToken,
  setAccessToken
} from '../util/accessTokenExtension'
import { TokenRefreshLink } from 'apollo-link-token-refresh'
import jwtDecode, { JwtPayload } from 'jwt-decode'
import browser from 'webextension-polyfill'
import { API_URL } from './apolloClient'
import { device } from '@src/background/ExtensionDevice'

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
    const url = `${API_URL?.replace('/graphql', '')}/refresh_token`

    return await fetch(url, {
      method: 'POST',
      credentials: 'include'
    })
  },
  handleFetch: async (accessToken) => {
    await browser.storage.local.set({ 'access-token': accessToken })
    setAccessToken(accessToken)
  },
  handleError: async (err) => {
    console.warn('Your refresh token is invalid. You must login again', err)
    await removeToken()
    await device.clearLocalStorage()
  }
})
