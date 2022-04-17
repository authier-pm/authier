import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { getUserFromToken } from '@src/util/accessTokenExtension'
import cryptoJS from 'crypto-js'

import React, {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
  FunctionComponent,
  useEffect,
  useContext
} from 'react'
import browser from 'webextension-polyfill'
import { DeviceStateContext } from './DeviceStateProvider'
const { AES, enc } = cryptoJS

export type IUserContext = {
  setUserId: Dispatch<SetStateAction<string | undefined>>
  userId: string | undefined
  localStorage: any
}

export const UserContext = createContext<IUserContext>({} as any)

export const UserProvider: FunctionComponent = ({ children }) => {
  const [userId, setUserId] = useState<string>()
  const [localStorage, setLocalStorage] = useState<any>()

  useEffect(() => {
    async function checkStorage() {
      const storage = await browser.storage.local.get()
      setLocalStorage(storage.encryptedAuthsMasterPassword)
      return storage
    }
    checkStorage()

    async function getId() {
      try {
        const id = await getUserFromToken()

        setUserId(id.userId)
      } catch (err) {
        console.log(err)
      }
    }
    getId()
  }, [])

  const value = {
    setUserId,
    userId,
    localStorage
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
