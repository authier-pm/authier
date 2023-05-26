import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { render } from '@testing-library/react-native'
import { NativeBaseProvider } from 'native-base'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from 'react-query'
import { MockedProvider } from '@apollo/client/testing'

const queryClient = jest.fn()
const Text = jest.fn()
const colorModeManager = jest.fn()
const theme = jest.fn()

const mocks = [{}]

const AllTheProviders = ({ children }) => {
  return (
    <NativeBaseProvider
      theme={theme as any}
      colorModeManager={colorModeManager as any}
    >
      <MockedProvider mocks={mocks as any}>
        <SafeAreaProvider>
          <I18nProvider i18n={i18n} defaultComponent={Text}>
            <QueryClientProvider client={queryClient as any}>
              {children}
            </QueryClientProvider>
          </I18nProvider>
        </SafeAreaProvider>
      </MockedProvider>
    </NativeBaseProvider>
  )
}

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// re-export everything
export * from '@testing-library/react-native'

// override render method
export { customRender as render }
