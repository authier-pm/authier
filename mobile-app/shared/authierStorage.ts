import type { MMKV } from 'react-native-mmkv'
import type { Browser } from 'webextension-polyfill'

export class AuthierStorage {
  browserStorage: null | Browser['storage']
  mmkv: MMKV
  constructor() {
    this.init()
  }

  async init() {
    if (process.env.RUNTIME_ENVIRONMENT === 'browser') {
      this.browserStorage = await import('webextension-polyfill').then(
        ({ storage }) => storage
      )
    } else {
      const MMKV = (await import('react-native-mmkv')).MMKV
      this.mmkv = new MMKV({
        id: 'user-storage',
        encryptionKey: 'test'
      })
    }
  }

  get(key: string) {
    if (process.env.RUNTIME_ENVIRONMENT === 'browser') {
      return this.browserStorage?.local.get(key)
    } else {
    }
  }
  set(key: string, value: string) {
    if (process.env.RUNTIME_ENVIRONMENT === 'browser') {
      return this.browserStorage?.local.set({ [key]: value })
    } else {
      return this.mmkv.set(key, value)
    }
  }
  remove(key: string) {
    if (process.env.RUNTIME_ENVIRONMENT === 'browser') {
      return this.browserStorage?.local.remove(key)
    } else {
      return this.mmkv.delete(key)
    }
  }
  onChange() {
    if (process.env.RUNTIME_ENVIRONMENT === 'browser') {
      // TODO
    } else {
      // we don't need to do anything here
    }
  }
}
