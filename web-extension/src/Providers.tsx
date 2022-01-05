import { ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import React from 'react'
import { Popup } from './popup/Popup'

import { UserProvider } from './providers/UserProvider'
import Routes from './Routes'
import { i18n } from '@lingui/core'
import { ToastContainer } from 'react-toastify' // use react-toastify instead of chakra toast. Chakra toast is somehow weirdly broken in extension, see: https://github.com/chakra-ui/chakra-ui/issues/4619
import 'react-toastify/dist/ReactToastify.css'
import { toastifyConfig } from '../../shared/toastifyConfig'
import { chakraCustomTheme } from '../../shared/chakraCustomTheme'
import { DeviceStateProvider } from './providers/DeviceStateProvider'
import { VaultRoutes } from './VaultRoutes'

export default function Providers({ parent }: { parent: string }) {
  return (
    <ChakraProvider theme={chakraCustomTheme}>
      <DeviceStateProvider>
        <UserProvider>
          <I18nProvider i18n={i18n}>
            <ToastContainer {...toastifyConfig} />
            {/* <Routes /> */}
            {parent === 'vault' ? <VaultRoutes /> : <Routes />}
          </I18nProvider>
        </UserProvider>
      </DeviceStateProvider>
    </ChakraProvider>
  )
}
