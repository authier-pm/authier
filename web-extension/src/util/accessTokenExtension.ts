import { jwtDecode } from 'jwt-decode'
import browser from 'webextension-polyfill'

export let accessToken: string | null = null
export const getTokenFromLocalStorage = async (): Promise<string | null> => {
  const storage = await browser.storage.local.get('access-token')
  const token = storage['access-token']
  return typeof token === 'string' ? token : null
}

export const setAccessToken = async (s: string) => {
  accessToken = s
  await browser.storage.local.set({
    'access-token': s
  })
}

export const removeToken = async () => {
  await browser.storage.local.remove('access-token')
  accessToken = null
}

export const getUserFromToken = async () => {
  const token = accessToken ?? (await getTokenFromLocalStorage())
  if (!token) return null
  return jwtDecode<{ userId: string }>(token)
}
;(async () => {
  accessToken = await getTokenFromLocalStorage()
})()
