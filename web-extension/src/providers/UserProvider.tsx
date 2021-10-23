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
  useEffect,
  useContext
} from 'react'
import browser from 'webextension-polyfill'
import { BackgroundContext } from './BackgroundProvider'
const { AES, enc } = cryptoJS

export type IUserContext = {
  setUserId: Dispatch<SetStateAction<string | undefined>>
  userId: string | undefined
  localStorage: any
  fireToken: string
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
  const { backgroundState } = useContext(BackgroundContext)
  const [userId, setUserId] = useState<string>()
  const [localStorage, setLocalStorage] = useState<any>()
  const [fireToken, setFireToken] = useState<string>('')

  // useEffect(() => {
  //   chrome.runtime.sendMessage({
  //     action: BackgroundMessageType.setUserIdAndMasterPassword,
  //     payload: {
  //       userId,
  //       masterPassword
  //     }
  //   })
  // }, [masterPassword, userId])

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
    setUserId,
    userId,
    localStorage,
    fireToken
  }
  console.log(value)
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
