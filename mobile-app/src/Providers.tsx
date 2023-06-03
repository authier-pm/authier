import React, { useEffect } from 'react'
import { ApolloProvider } from '@apollo/client'
import { apolloClient, cache } from './apollo/ApolloClient'
import {
  ColorMode,
  NativeBaseProvider,
  StorageManager,
  Text
} from 'native-base'
import { theme } from './Theme'
import Routes from './Routes'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { messages as enMessages } from './locales/en/messages'
import { messages as csMessages } from './locales/cs/messages'
import { QueryClient, QueryClientProvider } from 'react-query'

import { persistCache, MMKVWrapper } from 'apollo3-cache-persist'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { getSensitiveItem, setSensitiveItem } from './utils/secretStorage'
import { storage } from './utils/storage'

i18n.load({
  en: enMessages,
  cs: csMessages
})
i18n.activate('cs')

const colorModeManager: StorageManager = {
  get: async () => {
    try {
      let val = await getSensitiveItem('@color-mode')
      if (val === null) {
        return 'dark'
      }
      return val === 'dark' ? 'dark' : 'light'
    } catch (e) {
      return 'light'
    }
  },
  set: async (value: ColorMode) => {
    try {
      await setSensitiveItem('@color-mode', value as string)
    } catch (e) {
      console.log(e)
    }
  }
}

const queryClient = new QueryClient()

export const Providers = () => {
  useEffect(() => {
    persistCache({
      cache,
      storage: new MMKVWrapper(storage)
    })
  }, [])

  return (
    <NativeBaseProvider theme={theme} colorModeManager={colorModeManager}>
      <ApolloProvider client={apolloClient}>
        <SafeAreaProvider>
          <I18nProvider i18n={i18n} defaultComponent={Text}>
            <QueryClientProvider client={queryClient}>
              <Routes />
            </QueryClientProvider>
          </I18nProvider>
        </SafeAreaProvider>
      </ApolloProvider>
    </NativeBaseProvider>
  )
}
