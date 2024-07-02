import {
  accessToken,
  removeToken,
  setAccessToken
} from '../util/accessTokenExtension'
import { TokenRefreshLink } from 'apollo-link-token-refresh'
import { JwtPayload, jwtDecode } from 'jwt-decode'
import browser from 'webextension-polyfill'
import { API_URL } from './API_URL'
import { device } from '@src/background/ExtensionDevice'
const tokenRefreshBaseUrl = API_URL?.replace('/graphql', '')

export const tokenRefresh = new TokenRefreshLink({
  accessTokenField: 'accessToken',
  isTokenValidOrUndefined: async () => {
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
  handleFetch: async (accessToken) => {
    await browser.storage.local.set({ 'access-token': accessToken })
    setAccessToken(accessToken)
  },
  handleError: async (err) => {
    console.log('Your refresh token is invalid. You must login again', err)
    await removeToken()
    await device.clearLocalStorage()
  }
})
