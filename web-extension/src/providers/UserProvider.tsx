import { Box, Flex, Spinner } from '@chakra-ui/react'
import { MessageType } from '@src/backgroundPage'
import { IsLoggedInQuery, useIsLoggedInQuery } from '@src/popup/Popup.codegen'
import { getUserFromToken } from '@src/util/accessToken'
import { useBackground } from '@src/util/useBackground'
import React, {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
  FunctionComponent,
  useEffect
} from 'react'
import { browser } from 'webextension-polyfill-ts'

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
  setPassword: Dispatch<SetStateAction<string>>
  password: string
  setUserId: Dispatch<SetStateAction<string | undefined>>
  userId: string | undefined
  isApiLoggedIn: Boolean
  localStorage: any
  fireToken: string
}>({} as any)

export const UserProvider: FunctionComponent = ({ children }) => {
  const [password, setPassword] = useState<string>('bob')
  const { data, loading, error } = useIsLoggedInQuery()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  const [localStorage, setLocalStorage] = useState<any>()
  const [fireToken, setFireToken] = useState<string>('')
  const { safeLocked } = useBackground()

  useEffect(() => {
    async function checkStorage() {
      const storage = await browser.storage.local.get()
      setLocalStorage(storage.encryptedAuthsMasterPassword)
      return storage
    }
    checkStorage()

    chrome.runtime.sendMessage(
      MessageType.getFirebaseToken,
      (res: { t: string }) => {
        setFireToken(res.t)
      }
    )

    async function getId() {
      let id = await getUserFromToken()
      //@ts-expect-error
      setUserId(id.userId)
    }
    getId()
  }, [])

  return (
    <UserContext.Provider
      value={{
        password,
        setPassword,
        setUserId,
        userId,
        isApiLoggedIn: !!(data?.authenticated && !loading),
        localStorage,
        fireToken
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
