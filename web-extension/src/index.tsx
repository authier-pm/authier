import * as Sentry from '@sentry/browser'

import React from 'react'
import ReactDOM from 'react-dom'
import browser from 'webextension-polyfill'
import { ApolloProvider } from '@apollo/client'
import App from './App'
import { apolloClient } from './apollo/apolloClient'
import { ColorModeScript, theme } from '@chakra-ui/react'

Sentry.init({
  dsn: 'https://528d6bfc04eb436faea6046afc419f56@o997539.ingest.sentry.io/5955889'
})

export const renderPopup = () => {
  const popupElement = document.getElementById('popup')

  if (!popupElement) {
    return
  }
  ReactDOM.render(
    <ApolloProvider client={apolloClient}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <App parent="popup" />
    </ApolloProvider>,
    popupElement
  )
}
browser.tabs.query({ active: true, currentWindow: true }).then(renderPopup)

browser.runtime.connect({ name: 'popup' })
