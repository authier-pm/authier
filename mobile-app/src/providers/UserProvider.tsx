import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useEffect
} from 'react'
import messaging from '@react-native-firebase/messaging'
import { useIsLoggedInQuery } from './UserProvider.codegen'

export const UserContext = createContext<{
  isLogged: boolean
  setIsLogged: Dispatch<SetStateAction<boolean>>
  token: string | null
  isApiLoggedIn: Boolean
}>({} as any)

export default function UserProvider({ children }) {
  const [isLogged, setIsLogged] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const { data, loading } = useIsLoggedInQuery()

  useEffect(() => {
    async function getToken() {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const refresed = await messaging().onTokenRefresh(async (fcm) => {
        console.log('test')
        setToken(fcm)
        return
      })
      const Token = await messaging().getToken()
      console.log('t', Token)
      setToken(Token)
    }

    getToken()
  }, [])

  return (
    <UserContext.Provider
      value={{
        isLogged,
        setIsLogged,
        token,
        isApiLoggedIn: !!(data?.authenticated && !loading)
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
