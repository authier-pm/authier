import jwtDecode from 'jwt-decode'
import browser from 'webextension-polyfill'

export let accessToken: string | null = null
export let getTokenFromLocalStorage = async (): Promise<string> => {
  const storage = await browser.storage.local.get('access-token')
  return storage['access-token']
}

export const setAccessToken = async (s: string) => {
  accessToken = s
  await browser.storage.local.set({
    'access-token': s
  })
}

export const removeToken = async () => {
  await browser.storage.local.remove('access-token')
  accessToken = ''
}

export const getUserFromToken = async () => {
  return jwtDecode<{ userId: string }>(await getTokenFromLocalStorage())
}
;(async () => {
  accessToken = await getTokenFromLocalStorage()
})()
