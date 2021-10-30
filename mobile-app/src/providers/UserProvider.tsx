import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useEffect
} from 'react'
import messaging from '@react-native-firebase/messaging'
import { useIsLoggedInQuery, useLogoutMutation } from './UserProvider.codegen'
import * as Keychain from 'react-native-keychain'

export const UserContext = createContext<{
  isLogged: boolean
  setIsLogged: Dispatch<SetStateAction<boolean>>
  token: string | null
  isApiLoggedIn: Boolean
  logout: () => void
}>({} as any)

export default function UserProvider({ children }) {
  const [logout] = useLogoutMutation()
  const [isLogged, setIsLogged] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const { data, loading } = useIsLoggedInQuery()

  useEffect(() => {
    async function getToken() {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      await messaging().onTokenRefresh(async (fcm) => {
        console.log('ressetting token')
        setToken(fcm)
        return
      })
      const Token = await messaging().getToken()
      console.log('t', Token)
      setToken(Token)
    }

    //Check asyncStorage if is the accessToken valid
    async function checkCredencials() {
      let value = await Keychain.getGenericPassword()

      if (value) {
        setIsLogged(true)
      }
      return value
    }

    getToken()
    checkCredencials()
  }, [])

  return (
    <UserContext.Provider
      value={{
        isLogged,
        setIsLogged,
        token,
        isApiLoggedIn: !!(data?.authenticated && !loading),
        logout: async () => {
          setIsLogged(false)
          await Keychain.resetGenericPassword()
          await logout()
        }
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
