import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import React from 'react'

import { UserProvider } from './providers/UserProvider'
import PopupRoutes from './PopupRoutes'
import { i18n } from '@lingui/core'
import { ToastContainer } from 'react-toastify' // use react-toastify instead of chakra toast. Chakra toast is somehow weirdly broken in extension, see: https://github.com/chakra-ui/chakra-ui/issues/4619
import { toastifyConfig } from '../../shared/toastifyConfig'
import { chakraRawTheme } from '../../shared/chakraRawTheme'
import { DeviceStateProvider } from './providers/DeviceStateProvider'
import { messages } from './locale/en-gb/messages'
import { VaultRouter } from './pages-vault/VaultRouter'
import 'react-toastify/dist/ReactToastify.css'

i18n.load('en', messages)
i18n.activate('en')
export const chakraCustomTheme = extendTheme(chakraRawTheme)

export default function Providers({ parent }: { parent: string }) {
  return (
    <ChakraProvider theme={chakraCustomTheme}>
      <DeviceStateProvider>
        <UserProvider>
          <I18nProvider i18n={i18n}>
            <ToastContainer {...toastifyConfig} />
            {/* <Routes /> */}
            {parent === 'vault' ? <VaultRouter /> : <PopupRoutes />}
          </I18nProvider>
        </UserProvider>
      </DeviceStateProvider>
    </ChakraProvider>
  )
}
