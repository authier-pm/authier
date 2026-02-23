import { onError } from '@apollo/client/link/error'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import fetch from 'cross-fetch'
import {
  ApolloClient,
  InMemoryCache,
  from,
  HttpLink,
  ApolloLink
} from '@apollo/client'
import { RetryLink } from 'apollo-link-retry'
import { print } from 'graphql'
import { tap } from 'rxjs'

import { setContext } from '@apollo/client/link/context'
import { tokenRefresh } from './tokenRefresh'
import { QueueLink } from './QueueLink'
import { API_URL } from '@env'
import { Toast } from 'native-base'
import { useDeviceStore } from '@src/utils/deviceStore'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'

//REVERSE PORTS adb reverse tcp:5051 tcp:5051 or use https://stackoverflow.com/a/2235255/671457

if (!API_URL) {
  throw new Error('API_URL is not defined')
}
console.log('API_URL23', API_URL)

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
  return forward(operation).pipe(
    tap((data) => {
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
  )
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
const errorLink = onError(({ error, result }) => {
  if (CombinedGraphQLErrors.is(error) && error.errors.length > 0) {
    console.log(error.errors[0].message)
    if (error.errors[0].message === 'not authenticated') {
      //Here just logout the user
      useDeviceStore.getState().clearAndReload()
    }
    error.errors.map(({ message, locations, path }) => {
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
    return
  }
  if (error) {
    console.error(`[Network error]: ${error}`)
    console.error(result)
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
