import { Box, Flex, Spinner } from '@chakra-ui/react'
import { IsLoggedInQuery, useIsLoggedInQuery } from '@src/popup/Popup.codegen'
import { getUserFromToken } from '@src/util/accessToken'
import { useBackground } from '@src/util/backgroundState'
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
  setIsAuth: Dispatch<SetStateAction<Boolean>>
  isAuth: Boolean
  setVerify: Dispatch<SetStateAction<Boolean>>
  verify: Boolean
  localStorage: any
  fireToken: string
}>({} as any)

export const UserProvider: FunctionComponent = ({ children }) => {
  const [password, setPassword] = useState<string>('bob')
  const { data, loading, error } = useIsLoggedInQuery()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [isAuth, setIsAuth] = useState<Boolean>(false)
  const [verify, setVerify] = useState<Boolean>(false)
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
      { generateToken: true },
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

  useEffect(() => {
    console.log('isLocked', safeLocked)
    if (safeLocked) {
      setVerify(true)
    }
  }, [safeLocked])

  useEffect(() => {
    if (data?.authenticated && !loading) {
      //Save user ID to storage
      setIsAuth(true)
    }
  }, [data?.authenticated])

  return (
    <UserContext.Provider
      value={{
        password,
        setPassword,
        setUserId,
        userId,
        setIsAuth,
        isAuth,
        verify,
        setVerify,
        localStorage,
        fireToken
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
