import SInfo from 'react-native-sensitive-info'
import jwtDecode from 'jwt-decode'

export const getAccessToken = async () => {
  const value = await SInfo.getItem('@accessToken', {
    sharedPreferencesName: 'mySharedPrefs',
    keychainService: 'myKeychain'
  })

  return value
}

export const saveAccessToken = async (value) => {
  await await SInfo.setItem('@accessToken', value, {
    sharedPreferencesName: 'mySharedPrefs',
    keychainService: 'myKeychain'
  })
}

export const clearAccessToken = async () => {
  return await SInfo.deleteItem('@accessToken', {
    sharedPreferencesName: 'mySharedPrefs',
    keychainService: 'myKeychain'
  })
}

export const userIdFromToken = async () => {
  const token = await getAccessToken()
  //@ts-expect-error
  return jwtDecode(token).userId
}
