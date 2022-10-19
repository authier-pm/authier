import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useEffect
} from 'react'
import messaging from '@react-native-firebase/messaging'
import { useIsLoggedInQuery } from './UserProvider.codegen'
import { accessToken, clearAccessToken } from '../utils/tokenFromAsyncStorage'
import jwtDecode from 'jwt-decode'

export const UserContext = createContext<{
  isLogged: boolean
  setIsLogged: Dispatch<SetStateAction<boolean>>
  token: string | null
  isApiLoggedIn: Boolean
  logout: () => void
}>({} as any)

export default function UserProvider({ children }) {
  const [isLogged, setIsLogged] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const { data, loading } = useIsLoggedInQuery()

  useEffect(() => {
    async function getToken() {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      messaging().onTokenRefresh(async (fcm) => {
        console.log('ressetting token')
        setToken(fcm)
        return
      })
      const Token = await messaging().getToken()
      setToken(Token)
    }

    //Check asyncStorage if is the accessToken valid
    async function isAccessTokenValid() {
      const token = accessToken

      if (!token) {
        setIsLogged(false)
        return false
      }

      try {
        // @ts-expect-error
        const { exp } = jwtDecode(token)
        if (Date.now() >= exp * 1000) {
          setIsLogged(false)
          return false
        } else {
          setIsLogged(true)
          return true
        }
      } catch (error) {
        return false
      }
    }

    isAccessTokenValid()
    getToken()
  }, [data, loading])

  return (
    <UserContext.Provider
      value={{
        isLogged,
        setIsLogged,
        token,
        isApiLoggedIn: !!(data?.authenticated && !loading),
        logout: async () => {
          setIsLogged(false)
          clearAccessToken()
          // await logout()
        }
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
