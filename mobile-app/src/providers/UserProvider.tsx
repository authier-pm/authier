import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useEffect
} from 'react'
import messaging from '@react-native-firebase/messaging'
import * as Keychain from 'react-native-keychain'

export const UserContext = createContext<{
  isLogged: boolean
  setIsLogged: Dispatch<SetStateAction<boolean>>
  token: string | null
}>({} as any)

export default function UserProvider({ children }) {
  const [isLogged, setIsLogged] = useState(false)
  const [hasDate, setHasData] = useState(false)
  const [token, setToken] = useState<string | null>(null)

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

  useEffect(() => {
    const getData = async () => {
      //@ts-expect-error
      let { password } = await Keychain.getGenericPassword()

      if (password) {
        setHasData(true)
        return true
      }

      return false
    }

    getData()

    if (hasDate) {
      setIsLogged(true)
    }
  }, [hasDate])

  return (
    <UserContext.Provider value={{ isLogged, setIsLogged, token }}>
      {children}
    </UserContext.Provider>
  )
}
