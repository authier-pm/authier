import { ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import React from 'react'
import { Popup } from './popup/Popup'
import { AuthsProvider } from './providers/AuthsProvider'
import { UserProvider } from './providers/UserProvider'
import Routes from './Routes'
import { i18n } from '@lingui/core'
import { Flip, ToastContainer } from 'react-toastify' // use react-toastify instead of chakra toast. Chakra toast is somehow weirdly broken in extension, see: https://github.com/chakra-ui/chakra-ui/issues/4619
import 'react-toastify/dist/ReactToastify.css'

export default function Providers() {
  return (
    <ChakraProvider>
      <UserProvider>
        <AuthsProvider>
          <I18nProvider i18n={i18n}>
            <ToastContainer
              closeOnClick
              pauseOnHover={false}
              autoClose={2700}
              hideProgressBar
              transition={Flip}
            />
            <Routes />
          </I18nProvider>
        </AuthsProvider>
      </UserProvider>
    </ChakraProvider>
  )
}
