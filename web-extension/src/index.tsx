import React from 'react'
import ReactDOM from 'react-dom'
import browser from 'webextension-polyfill'
import { Popup } from './popup/Popup'
import { ApolloProvider } from '@apollo/client'
import App from './App'
import { apolloClient } from './apollo/apolloClient'

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  ReactDOM.render(
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>,
    document.getElementById('popup')
  )
})

browser.runtime.connect({ name: 'popup' })
