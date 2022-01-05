import * as Sentry from '@sentry/browser'

import React from 'react'
import ReactDOM from 'react-dom'
import browser from 'webextension-polyfill'
import { ApolloProvider } from '@apollo/client'
import App from './App'
import { apolloClient } from './apollo/apolloClient'
import { HashRouter, BrowserRouter } from 'react-router-dom'
import { BackgroundMessageType } from './background/BackgroundMessageType'

Sentry.init({
  dsn: 'https://528d6bfc04eb436faea6046afc419f56@o997539.ingest.sentry.io/5955889'
})

export const renderVault = () => {
  const vaultRoot = document.getElementById('vault')
  if (vaultRoot) {
    ReactDOM.render(
      <HashRouter basename="/">
        <ApolloProvider client={apolloClient}>
          <App parent={'vault'} />
        </ApolloProvider>
      </HashRouter>,
      vaultRoot
    )
  }
}
browser.tabs.query({ active: true, currentWindow: true }).then(renderVault)

browser.runtime.connect({ name: 'vault' })
browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === BackgroundMessageType.rerenderViews) {
    renderVault()
  }
})
