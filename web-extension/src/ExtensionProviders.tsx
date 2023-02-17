import {
  ChakraProvider,
  createStandaloneToast,
  extendTheme
} from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { UserProvider } from './providers/UserProvider'

import { chakraRawTheme } from '../../shared/chakraRawTheme'
import { DeviceStateProvider } from './providers/DeviceStateProvider'
import { messages } from './locale/en-gb/messages'

export const { ToastContainer, toast } = createStandaloneToast({
  theme: chakraRawTheme
})

// @ts-expect-error
i18n.load('en', messages)
i18n.activate('en')
export const chakraCustomTheme = extendTheme(chakraRawTheme)

export function ExtensionProviders({ children }) {
  return (
    <>
      <ChakraProvider theme={chakraCustomTheme}>
        <DeviceStateProvider>
          <UserProvider>
            <I18nProvider i18n={i18n}>{children}</I18nProvider>
          </UserProvider>
        </DeviceStateProvider>
      </ChakraProvider>
    </>
  )
}
