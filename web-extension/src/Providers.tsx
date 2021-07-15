import { ChakraProvider } from '@chakra-ui/react'
import React from 'react'
import { Popup } from './popup/Popup'
import { AuthsProvider } from './providers/AuthsProvider'
import { UserProvider } from './providers/UserProvider'

export default function Providers() {
  return (
    <ChakraProvider>
      <UserProvider>
        <AuthsProvider>
          <Popup />
        </AuthsProvider>
      </UserProvider>
    </ChakraProvider>
  )
}
