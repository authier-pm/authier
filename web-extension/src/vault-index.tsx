import * as Sentry from '@sentry/browser'

import React from 'react'
import ReactDOM from 'react-dom'
import browser from 'webextension-polyfill'
import { ApolloProvider } from '@apollo/client'
import App from './App'
import { apolloClient } from './apollo/apolloClient'
import { HashRouter, MemoryRouter } from 'react-router-dom'

Sentry.init({
  dsn: 'https://528d6bfc04eb436faea6046afc419f56@o997539.ingest.sentry.io/5955889'
})

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  ReactDOM.render(
    <HashRouter basename="/">
      <ApolloProvider client={apolloClient}>
        <App parent={'vault'} />
      </ApolloProvider>
    </HashRouter>,
    document.getElementById('vault')
  )
})

browser.runtime.connect({ name: 'vault' })
