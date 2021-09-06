import jwtDecode from 'jwt-decode'
import { browser } from 'webextension-polyfill-ts'

export let accessToken = ''
export let getTokenFromLocalStorage = async (): Promise<string> => {
  const storage = await browser.storage.local.get('access-token')
  return storage['access-token']
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
  return jwtDecode<{ userId: string }>(await getTokenFromLocalStorage())
}
