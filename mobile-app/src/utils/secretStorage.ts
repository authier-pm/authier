import SInfo from 'react-native-sensitive-info'

export function setSensitiveItem(key: string, value: any) {
  return SInfo.setItem(
    key,
    typeof value === 'object' ? JSON.stringify(value) : value,
    {
      sharedPreferencesName: 'authierShared',
      keychainService: 'authierKCH'
    }
  )
}

export function getSensitiveItem(key: string) {
  return SInfo.getItem(key, {
    sharedPreferencesName: 'authierShared',
    keychainService: 'authierKCH'
  })
}
