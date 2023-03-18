import { MMKV } from 'react-native-mmkv'

export const storage = new MMKV({
  id: 'user-storage',
  //TODO: Change this
  encryptionKey: 'test'
})
