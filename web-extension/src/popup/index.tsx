import React from 'react'
import ReactDOM from 'react-dom'
import { browser } from 'webextension-polyfill-ts'
import { Popup } from './Popup'
import { ApolloProvider } from '@apollo/client'
import App from './App'
import { apolloClient } from './apolloClient'

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  ReactDOM.render(
    <ApolloProvider client={apolloClient}>
      <Popup />
    </ApolloProvider>,
    document.getElementById('popup')
  )
})
