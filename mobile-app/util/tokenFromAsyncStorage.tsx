import AsyncStorage from '@react-native-async-storage/async-storage'
export const tokenFromLocalStorage = async () => {
  try {
    const value = await AsyncStorage.getItem('@storage_Key')
    if (value !== null) {
      // value previously stored
      return JSON.parse(value).token
    }
  } catch (e) {
    // error reading value
    console.error(e)
  }
}
