import SInfo from 'react-native-sensitive-info'

export function setSensitiveItem(key: string, value: any) {
  return SInfo.setItem(
    key,
    typeof value === 'object' ? JSON.stringify(value) : value,
    {
      service: 'authierKCH'
    }
  )
}

export async function getSensitiveItem(key: string) {
  const item = await SInfo.getItem(key, {
    service: 'authierKCH'
  })
  return item?.value ?? null
}
