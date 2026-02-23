import { StateStorage } from 'zustand/middleware'
import { createMMKV } from 'react-native-mmkv'

export let storage = createMMKV()

export type ApolloCacheStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string | null) => void
  removeItem: (key: string) => void
}

export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value)
  },
  getItem: (name) => {
    const value = storage.getString(name)
    return value ?? null
  },
  removeItem: (name) => {
    storage.remove(name)
  }
}

export const apolloCacheStorage: ApolloCacheStorage = {
  getItem: (key) => {
    return storage.getString(key) ?? null
  },
  setItem: (key, value) => {
    if (value === null) {
      storage.remove(key)
      return
    }

    storage.set(key, value)
  },
  removeItem: (key) => {
    storage.remove(key)
  }
}
