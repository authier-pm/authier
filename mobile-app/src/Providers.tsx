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
import { DeviceProvider } from './providers/DeviceProvider'
import { I18nProvider } from '@lingui/react'
import SInfo from 'react-native-sensitive-info'
import { i18n } from '@lingui/core'
import { messages } from './locales/en/messages'
import { en as enPlurals } from 'make-plural/plurals'

import { persistCache, MMKVWrapper } from 'apollo3-cache-persist'
import { storage } from '../App'
import { SafeAreaProvider } from 'react-native-safe-area-context'

i18n.loadLocaleData('en', { plurals: enPlurals })
i18n.load('en', messages)
i18n.activate('en')

const colorModeManager: StorageManager = {
  get: async () => {
    try {
      let val = await SInfo.getItem('@color-mode', {
        sharedPreferencesName: 'mySharedPrefs',
        keychainService: 'myKeychain'
      })
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
      await SInfo.setItem('@color-mode', value as string, {
        sharedPreferencesName: 'mySharedPrefs',
        keychainService: 'myKeychain'
      })
    } catch (e) {
      console.log(e)
    }
  }
}

export const Providers = () => {
  useEffect(() => {
    persistCache({
      cache,
      storage: new MMKVWrapper(storage)
    })
  }, [])

  return (
    <ApolloProvider client={apolloClient}>
      <DeviceProvider>
        <SafeAreaProvider>
          <I18nProvider i18n={i18n} defaultComponent={Text}>
            <NativeBaseProvider
              theme={theme}
              colorModeManager={colorModeManager}
            >
              <Routes />
            </NativeBaseProvider>
          </I18nProvider>
        </SafeAreaProvider>
      </DeviceProvider>
    </ApolloProvider>
  )
}
