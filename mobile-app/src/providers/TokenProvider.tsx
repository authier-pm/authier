import React, { createContext, useState, useEffect } from 'react'
import messaging from '@react-native-firebase/messaging'

export const GetTokenProvider = createContext<{ token: string | null }>(
  {} as any
)

export default function TokenProvider({ children }) {
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

  return (
    <GetTokenProvider.Provider value={{ token }}>
      {children}
    </GetTokenProvider.Provider>
  )
}
