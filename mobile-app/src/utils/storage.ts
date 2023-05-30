import { StateStorage } from 'zustand/middleware'
// import { getUniqueId } from 'react-native-device-info'
import { MMKV } from 'react-native-mmkv'

export let storage = new MMKV()

// export async function initializeStorage() {
//   const uniqueId = await getUniqueId()
//   storage = new MMKV({
//     id: 'user-storage',
//     encryptionKey: uniqueId
//   })
// }
//
// export function getStorage() {
//   if (!storage) {
//     console.error(
//       'Storage has not been initialized. Call initializeStorage first.'
//     )
//     return
//   }
//   return storage
// }

export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value)
  },
  getItem: (name) => {
    const value = storage.getString(name)
    return value ?? null
  },
  removeItem: (name) => {
    return storage.delete(name)
  }
}
