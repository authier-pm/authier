import React from 'react'
import ReactDOM from 'react-dom'
import { browser } from 'webextension-polyfill-ts'
import { Popup } from './Popup'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'

const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: 'http://localhost:5050/graphql'
})

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  ReactDOM.render(
    <ApolloProvider client={client}>
      <Popup />
    </ApolloProvider>,
    document.getElementById('popup')
  )
})
