import jwtDecode from 'jwt-decode'
import SInfo from 'react-native-sensitive-info'
import { getSensitiveItem, setSensitiveItem } from './secretStorage'
//TODO: Rename this file

export let accessToken: string | null = null
export const getAccessTokenFromStorage = async () => {
  const value = await getSensitiveItem('@accessToken')

  return value
}

export const saveAccessToken = async (s: string) => {
  accessToken = s
  await setSensitiveItem('@accessToken', s)
}

export const clearAccessToken = async () => {
  accessToken = ''
  return await SInfo.deleteItem('@accessToken', {
    sharedPreferencesName: 'authierShared',
    keychainService: 'authierKCH'
  })
}
export const getUserFromToken = async () => {
  return jwtDecode<{ userId: string }>(await getAccessTokenFromStorage())
}
;(async () => {
  accessToken = await getAccessTokenFromStorage()
})()
