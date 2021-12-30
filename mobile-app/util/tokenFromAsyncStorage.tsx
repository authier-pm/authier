import SInfo from 'react-native-sensitive-info'

export const getAccessToken = async () => {
  console.log('~ SInfo', SInfo)

  // const value = await SInfo.getItem('@accessToken', {
  //   sharedPreferencesName: 'mySharedPrefs',
  //   keychainService: 'myKeychain'
  // })

  return null
}

export const saveAccessToken = async (value) => {
  console.log('~ SInf2o', SInfo)

  await await SInfo.setItem('@accessToken', value, {
    sharedPreferencesName: 'mySharedPrefs',
    keychainService: 'myKeychain'
  })
}

export const clearAccessToken = async () => {
  console.log('~ SInfo3', SInfo)

  return await SInfo.deleteItem('@accessToken', {
    sharedPreferencesName: 'mySharedPrefs',
    keychainService: 'myKeychain'
  })
}
