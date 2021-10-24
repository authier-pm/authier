import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useEffect
} from 'react'
import RNSInfo from 'react-native-sensitive-info'

export const UserContext = createContext<{
  isLogged: boolean
  setIsLogged: Dispatch<SetStateAction<boolean>>
}>({} as any)

export default function UserProvider({ children }) {
  const [isLogged, setIsLogged] = useState(false)
  const [hasDate, setHasData] = useState(false)

  useEffect(() => {
    const getDate = async () => {
      let data = await RNSInfo.getItem('encryptedSecrets', {
        sharedPreferencesName: 'mySharedPrefs',
        keychainService: 'myKeychain'
      })
      console.log('data', data)
      if (data) {
        setHasData(true)
        return true
      }

      return false
    }

    getDate()

    if (hasDate) {
      setIsLogged(true)
    }
  }, [hasDate])

  return (
    <UserContext.Provider value={{ isLogged, setIsLogged }}>
      {children}
    </UserContext.Provider>
  )
}
