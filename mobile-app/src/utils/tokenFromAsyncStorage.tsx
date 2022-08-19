import jwtDecode from 'jwt-decode'
import SInfo from 'react-native-sensitive-info'

export let accessToken: string | null = null
export const getAccessToken = async () => {
  const value = await SInfo.getItem('@accessToken', {
    sharedPreferencesName: 'mySharedPrefs',
    keychainService: 'myKeychain'
  })

  return value
}

export const saveAccessToken = async (value) => {
  accessToken = value
  await SInfo.setItem('@accessToken', value, {
    sharedPreferencesName: 'mySharedPrefs',
    keychainService: 'myKeychain'
  })
}

export const clearAccessToken = async () => {
  accessToken = ''
  return await SInfo.deleteItem('@accessToken', {
    sharedPreferencesName: 'mySharedPrefs',
    keychainService: 'myKeychain'
  })
}
export const getUserFromToken = async () => {
  return jwtDecode<{ userId: string }>(await getAccessToken())
}
