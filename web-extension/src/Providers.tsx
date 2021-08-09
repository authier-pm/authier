import { ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import React from 'react'
import { Popup } from './popup/Popup'
import { AuthsProvider } from './providers/AuthsProvider'
import { UserProvider } from './providers/UserProvider'
import Routes from './Routes'
import { i18n } from '@lingui/core'

export default function Providers() {
  return (
    <ChakraProvider>
      <UserProvider>
        <AuthsProvider>
          <I18nProvider i18n={i18n}>
            <Routes />
          </I18nProvider>
        </AuthsProvider>
      </UserProvider>
    </ChakraProvider>
  )
}
