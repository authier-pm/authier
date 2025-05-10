import {
  ApolloClient,
  ApolloLink,
  from,
  HttpLink,
  InMemoryCache
} from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from 'apollo-link-retry'
import fetch from 'cross-fetch'
import { print } from 'graphql'

import QueueLink from 'apollo-link-queue'

import { setContext } from '@apollo/client/link/context'
import { tokenRefresh } from './tokenRefresh'

import { Toast } from 'native-base'
import { useDeviceStateStore } from '../utils/deviceStateStore'
import { useDeviceStore } from '../utils/deviceStore'

//REVERSE PORTS adb reverse tcp:5051 tcp:5051 or use https://stackoverflow.com/a/2235255/671457
const API_URL = process.env.EXPO_PUBLIC_API_URL
if (!API_URL) {
  throw new Error('API_URL is not defined')
}

const httpLink = new HttpLink({
  uri: API_URL,
  credentials: 'include',
  fetch
})

const timeStartLink = new ApolloLink((operation, forward) => {
  operation.setContext({ start: performance.now() })
  return forward(operation)
})

const logTimeLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((data) => {
    // data from a previous link
    const time = performance.now() - operation.getContext().start
    const opIdentifier = operation.operationName
      ? `operation ${operation.operationName}`
      : `operation ${print(operation.query).substring(0, 160)}`
    if (time > 3000) {
      console.warn(`${opIdentifier} ${time.toFixed()}ms`)
      if (__DEV__) {
        console.warn('operation', print(operation.query))
        console.warn('variables', operation.variables)
      }
    } else {
      console.log(`${opIdentifier} ${time.toFixed()}ms`)
    }
    return data
  })
})

const retryLink = new RetryLink()
export const queueLink = new QueueLink()

const authLink = setContext(async (_, { headers }) => {
  const accessToken = useDeviceStateStore.getState().accessToken
  //return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `bearer ${accessToken}` : ''
    }
  }
})

const ToastServerErrorDetails = {
  title: 'Something went wrong',
  variant: 'subtle',
  description: 'Please create a support ticket from the support page',
  status: 'warning'
}

// Log any GraphQL errors or network error that occurred
const errorLink = onError(({ graphQLErrors, networkError, response }) => {
  if (graphQLErrors && graphQLErrors.length > 0) {
    console.log(graphQLErrors[0].message)
    if (graphQLErrors[0].message === 'not authenticated') {
      //Here just logout the user
      useDeviceStore.getState().clearAndReload()
    }
    graphQLErrors.map(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
      //TODO: style this toast
      Toast.show({
        ...ToastServerErrorDetails,
        title: 'Something went wrong',
        description: message,
        variant: 'subtle'
      })
    })
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
    console.error(response)
  }
})

export const cache = new InMemoryCache()

export const apolloClient = new ApolloClient({
  link: from([
    timeStartLink,
    logTimeLink,
    tokenRefresh,
    errorLink,
    queueLink,
    retryLink,
    authLink,
    httpLink as any
  ]),
  cache: cache
})
