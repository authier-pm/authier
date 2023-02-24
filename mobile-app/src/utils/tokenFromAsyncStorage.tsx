import jwtDecode from 'jwt-decode'
import SInfo from 'react-native-sensitive-info'
//TODO: Rename this file

export let accessToken: string | null = null
export const getAccessTokenFromStorage = async () => {
  const value = await SInfo.getItem('@accessToken', {
    sharedPreferencesName: 'authierShared',
    keychainService: 'authierKCH'
  })

  return value
}

export const saveAccessToken = async (s: string) => {
  accessToken = s
  await SInfo.setItem('@accessToken', s, {
    sharedPreferencesName: 'authierShared',
    keychainService: 'authierKCH'
  })
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
