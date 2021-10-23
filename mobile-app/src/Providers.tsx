import React, { createContext, Dispatch, SetStateAction, useState } from 'react'
import { ApolloProvider } from '@apollo/client'
import { apoloCLient } from './ApolloClient'
import TokenProvider from './providers/TokenProvider'
import { NativeBaseProvider } from 'native-base'
import { theme } from './Theme'
import NotifyProvider from './providers/NotifyProvider'
import Routes from './Routes'

export const AuthsContext = createContext<{
  auths: Array<any>
  setAuths: Dispatch<
    SetStateAction<{ secret: string; label: string; icon: string }[]>
  >
}>({ auths: [] } as any)

export const Providers: React.FC<{}> = () => {
  const [auths, setAuths] = useState([
    {
      secret: 'JBSWY3DPEHPK3PXP',
      label: 'bitfinex',
      icon: 'https://chakra-ui.com/favicon.png'
    }
  ])

  return (
    <ApolloProvider client={apoloCLient}>
      <NotifyProvider>
        <AuthsContext.Provider value={{ auths, setAuths }}>
          <TokenProvider>
            <NativeBaseProvider theme={theme}>
              <Routes />
            </NativeBaseProvider>
          </TokenProvider>
        </AuthsContext.Provider>
      </NotifyProvider>
    </ApolloProvider>
  )
}
