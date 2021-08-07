import { Box } from '@chakra-ui/react'
import { IsLoggedInQuery, useIsLoggedInQuery } from '@src/popup/Popup.codegen'
import { getUserFromToken } from '@src/util/accessToken'
import React, {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
  FunctionComponent,
  useEffect
} from 'react'

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
  setVerify: Dispatch<SetStateAction<Boolean>>
  verify: Boolean
  setIsAuth: Dispatch<SetStateAction<Boolean>>
  isAuth: Boolean
}>({} as any)

export const UserProvider: FunctionComponent = ({ children }) => {
  const [password, setPassword] = useState<string>('bob')
  const [verify, setVerify] = useState<Boolean>(false)
  const { data, loading, error } = useIsLoggedInQuery()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [isAuth, setIsAuth] = useState<Boolean>(false)

  useEffect(() => {
    async function getId() {
      let id = await getUserFromToken()
      //@ts-expect-error
      setUserId(id.userId)
    }
    getId()
  }, [])

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
        setVerify,
        verify,
        userId,
        setIsAuth,
        isAuth
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
