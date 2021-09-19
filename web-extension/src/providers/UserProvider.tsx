import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { IsLoggedInQuery, useIsLoggedInQuery } from '@src/popup/Popup.codegen'
import { getUserFromToken } from '@src/util/accessTokenExtension'

import React, {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
  FunctionComponent,
  useEffect
} from 'react'
import browser from 'webextension-polyfill'

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

export const UserContext = createContext<{
  setUserId: Dispatch<SetStateAction<string | undefined>>
  userId: string | undefined
  isApiLoggedIn: Boolean
  localStorage: any
  fireToken: string
}>({} as any)

export const UserProvider: FunctionComponent = ({ children }) => {
  const { data, loading, error } = useIsLoggedInQuery()
  const [userId, setUserId] = useState<string | undefined>(undefined)
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

  const value = {
    setUserId,
    userId,
    isApiLoggedIn: !!(data?.authenticated && !loading),
    localStorage,
    fireToken
  }
  console.log(value)
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
