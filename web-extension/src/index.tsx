import * as Sentry from '@sentry/browser'

import React from 'react'
import ReactDOM from 'react-dom/client'
import browser from 'webextension-polyfill'
import { ApolloProvider } from '@apollo/client'
import App from './App'
import { apolloClient } from './apollo/apolloClient'
import { ColorModeScript } from '@chakra-ui/react'
import { chakraRawTheme } from '@shared/chakraRawTheme'

Sentry.init({
  dsn: 'https://528d6bfc04eb436faea6046afc419f56@o997539.ingest.sentry.io/5955889'
})

let popupRoot
export const renderPopup = () => {
  popupRoot.render(
    <ApolloProvider client={apolloClient}>
      <ColorModeScript
        initialColorMode={chakraRawTheme.config?.initialColorMode}
      />
      <App parent="popup" />
    </ApolloProvider>
  )
}
browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  popupRoot = ReactDOM.createRoot(
    document.getElementById('popup') as HTMLElement
  )
  renderPopup()
})
