import React from 'react'
import ReactDOM from 'react-dom'
import { browser } from 'webextension-polyfill-ts'
import { Popup } from './Popup'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  ApolloLink
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getAccessToken, setAccessToken } from '@src/util/accessToken'
import { onError } from '@apollo/client/link/error'
import { TokenRefreshLink } from 'apollo-link-token-refresh'
import jwtDecode from 'jwt-decode'
import App from './App'

const httpLink = createHttpLink({
  uri: 'http://localhost:5050/graphql'
})

const tokenRefresh = new TokenRefreshLink({
  accessTokenField: 'accessToken',
  isTokenValidOrUndefined: () => {
    const token = getAccessToken()

    if (!token) {
      return true
    }

    try {
      //@ts-expect-error
      const { exp } = jwtDecode(token)
      if (Date.now() >= exp * 1000) {
        return false
      } else {
        return true
      }
    } catch (error) {
      return false
    }
  },
  fetchAccessToken: async () => {
    return await fetch('http://localhost:5050/refresh_token', {
      method: 'POST',
      credentials: 'include'
    })
  },
  handleFetch: (accessToken) => {
    setAccessToken(accessToken)
  },
  handleError: (err) => {
    console.warn('Your refresh token is invalid. Try to relogin')
    console.error(err)
  }
})

// Log any GraphQL errors or network error that occurred
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    )
  if (networkError) console.log(`[Network error]: ${networkError}`)
})

const authLink = setContext((_, { headers }) => {
  //get the authentication token
  const accessToken = getAccessToken()
  //return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `bearer ${accessToken}` : ''
    }
  }
})

const client = new ApolloClient({
  link: ApolloLink.from([errorLink, tokenRefresh, authLink, httpLink]),
  cache: new InMemoryCache()
})

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  ReactDOM.render(
    <ApolloProvider client={client}>
      <Popup />
    </ApolloProvider>,
    document.getElementById('popup')
  )
})
