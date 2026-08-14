import { getUserFromToken } from '@src/util/accessTokenExtension'

import React, {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  type PropsWithChildren
} from 'react'
import browser from 'webextension-polyfill'

export type IUserContext = {
  setUserId: Dispatch<SetStateAction<string | undefined>>
  userId: string | undefined
  localStorage: any
}

export const UserContext = createContext<IUserContext>({} as any)

export const UserProvider = ({ children }: PropsWithChildren) => {
  const [userId, setUserId] = useState<string>()
  const [localStorage, setLocalStorage] = useState<any>()

  useEffect(() => {
    let isActive = true

    async function checkStorage() {
      const storage = await browser.storage.local.get()
      if (isActive) {
        setLocalStorage(storage.encryptedAuthsMasterPassword)
      }
      return storage
    }
    void checkStorage()

    const refreshUserId = () =>
      getUserFromToken()
        .then((id) => {
          if (isActive) {
            setUserId(id?.userId)
          }
        })
        .catch((error: unknown) => {
          console.error('Failed to read the logged-in user', error)
        })

    const onStorageChange = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName === 'local' && changes['access-token']) {
        void refreshUserId()
      }
    }

    void refreshUserId()
    browser.storage.onChanged.addListener(onStorageChange)

    return () => {
      isActive = false
      browser.storage.onChanged.removeListener(onStorageChange)
    }
  }, [])

  const value = {
    setUserId,
    userId,
    localStorage
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
