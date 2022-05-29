import * as Sentry from '@sentry/browser'

import React from 'react'
import ReactDOM from 'react-dom/client'

import browser from 'webextension-polyfill'
import { ApolloProvider } from '@apollo/client'
import App from './App'
import { apolloClient } from './apollo/apolloClient'
import { HashRouter } from 'react-router-dom'

Sentry.init({
  dsn: 'https://528d6bfc04eb436faea6046afc419f56@o997539.ingest.sentry.io/5955889'
})

let vaultRoot
export const renderVault = () => {
  vaultRoot.render(
    <HashRouter basename="/">
      <ApolloProvider client={apolloClient}>
        <App parent={'vault'} />
      </ApolloProvider>
    </HashRouter>
  )
}

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  vaultRoot = ReactDOM.createRoot(
    document.getElementById('vault') as HTMLElement
  )

  renderVault()
})
