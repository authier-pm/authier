import AsyncStorage from '@react-native-async-storage/async-storage'
export const getAccessToken = async () => {
  const value = await AsyncStorage.getItem('@accessToken')
  console.log('accessToken', value)
  return value
}

export const saveAccessToken = async (value) => {
  await AsyncStorage.setItem('@accessToken', value)
}

export const clearAccessToken = async () => {
  await AsyncStorage.removeItem('@accessToken')
}
