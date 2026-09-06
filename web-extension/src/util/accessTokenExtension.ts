import { jwtDecode } from 'jwt-decode'
import browser from 'webextension-polyfill'

export const getAccessToken = async (): Promise<string | null> => {
  await browser.storage.local.remove('access-token')
  const storage = await browser.storage.session.get('access-token')
  const token = storage['access-token']
  return typeof token === 'string' ? token : null
}

export const setAccessToken = async (token: string) => {
  await browser.storage.session.set({ 'access-token': token })
}

export const removeToken = async () => {
  await browser.storage.session.remove('access-token')
  await browser.storage.local.remove('access-token')
}

export const getUserFromToken = async () => {
  const token = await getAccessToken()
  return token ? jwtDecode<{ userId: string }>(token) : null
}
