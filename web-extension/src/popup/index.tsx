import React from 'react'
import ReactDOM from 'react-dom'
import { browser } from 'webextension-polyfill-ts'
import { Popup } from './Popup'
import ApolloClient from 'apollo-boost'
import { ApolloProvider } from '@apollo/react-hooks'

const client = new ApolloClient({
  uri: 'http://localhost:5050/playground'
})

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  ReactDOM.render(
    //@ts-expect-error
    <ApolloProvider client={client}>
      <Popup />
    </ApolloProvider>,
    document.getElementById('popup')
  )
})
