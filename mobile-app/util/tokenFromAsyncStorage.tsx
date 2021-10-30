import AsyncStorage from '@react-native-async-storage/async-storage'
export const getAccessToken = async () => {
  const value = await AsyncStorage.getItem('@accessToken')
  console.log('accessToken', value)
  return value
}

export const saveAccessToken = async (value) => {
  try {
    await AsyncStorage.setItem('@accessToken', value)
  } catch (e) {
    // saving error
    console.log(e)
  }
}

export const clearAccessToken = async () => {
  try {
    await AsyncStorage.removeItem('@accessToken')
  } catch (e) {
    // error reading value
    console.error(e)
  }
}
