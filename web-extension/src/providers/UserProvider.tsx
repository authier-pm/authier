import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { IsLoggedInQuery, useIsLoggedInQuery } from '@src/popup/Popup.codegen'
import { getUserFromToken } from '@src/util/accessTokenExtension'
import cryptoJS from 'crypto-js'

import React, {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
  FunctionComponent,
  useEffect
} from 'react'
import browser from 'webextension-polyfill'
const { AES, enc } = cryptoJS

export type IUserContext = {
  setMasterPassword: Dispatch<SetStateAction<string>>
  masterPassword: string
  setUserId: Dispatch<SetStateAction<string | undefined>>
  userId: string | undefined
  isApiLoggedIn: Boolean
  localStorage: any
  fireToken: string
  encrypt(data: string, password?: string): string
  decrypt(data: string, password?: string): string
}

// const onMessageListener = () =>
//   new Promise((resolve) => {
//     onMessage(messaging, (payload) => {
//       resolve(payload)
//     })
//   })
//   onMessageListener()
//     .then((payload) => {
//       console.log(payload)
//     })
//     .catch((err) => console.log('failed: ', err))

export const UserContext = createContext<IUserContext>({} as any)

export const UserProvider: FunctionComponent = ({ children }) => {
  const [masterPassword, setMasterPassword] = useState<string>('bob')
  const { data, loading, error } = useIsLoggedInQuery()
  const [userId, setUserId] = useState<string>()
  const [localStorage, setLocalStorage] = useState<any>()
  const [fireToken, setFireToken] = useState<string>('')

  useEffect(() => {
    async function checkStorage() {
      const storage = await browser.storage.local.get()
      setLocalStorage(storage.encryptedAuthsMasterPassword)
      return storage
    }
    checkStorage()

    chrome.runtime.sendMessage(
      { action: BackgroundMessageType.getFirebaseToken },
      (res: { t: string }) => {
        setFireToken(res.t)
      }
    )

    async function getId() {
      try {
        let id = await getUserFromToken()

        setUserId(id.userId)
      } catch (err) {
        console.log(err)
      }
    }
    getId()
  }, [])

  const cryptoOptions = {
    iv: enc.Utf8.parse(userId as string)
  }

  const value = {
    masterPassword,
    setMasterPassword,
    setUserId,
    userId,
    isApiLoggedIn: !!(data?.authenticated && !loading),
    localStorage,
    fireToken,
    encrypt(data: string, password = masterPassword): string {
      return AES.encrypt(data, password, cryptoOptions).toString()
    },
    decrypt(data: string, password = masterPassword): string {
      return AES.decrypt(data, password, cryptoOptions).toString()
    }
  }
  console.log(value)
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
