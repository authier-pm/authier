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
    if (data?.authenticated && !loading) {
      //Save user ID to storage
      setIsAuth(true)
      console.log('test: ', userId, isAuth)
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
