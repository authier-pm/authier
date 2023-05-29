import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { NativeBaseProvider } from 'native-base'

import { QueryClientProvider } from 'react-query'
import { ApolloProvider } from '@apollo/client'

import { RenderOptions, render } from '@testing-library/react-native'
import { makeSsrClient } from '@src/apollo/ApolloClientMock'
import { ReactElement } from 'react'

const inset = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 }
}
const Text = jest.fn()
const theme = jest.fn()
const queryClient = jest.fn()
const AllTheProviders = ({ children }) => {
  return (
    <NativeBaseProvider initialWindowMetrics={inset} theme={theme as any}>
      <ApolloProvider client={makeSsrClient as any}>
        <I18nProvider i18n={i18n} defaultComponent={Text}>
          <QueryClientProvider client={queryClient as any}>
            {children}
          </QueryClientProvider>
        </I18nProvider>
      </ApolloProvider>
    </NativeBaseProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }
