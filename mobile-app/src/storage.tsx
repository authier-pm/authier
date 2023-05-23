// import { MMKV } from 'react-native-mmkv'
//
// export const storage = new MMKV({
//   id: 'user-storage',
//   //TODO: Change this
//   encryptionKey: 'test'
// })

import { MMKV } from 'react-native-mmkv'
import { getUniqueId } from 'react-native-device-info'

export let storage

export async function initializeStorage() {
  const uniqueId = await getUniqueId()
  storage = new MMKV({
    id: 'user-storage',
    encryptionKey: uniqueId
  })
}

export function getStorage() {
  if (!storage) {
    console.error(
      'Storage has not been initialized. Call initializeStorage first.'
    )
    return
  }
  return storage
}
