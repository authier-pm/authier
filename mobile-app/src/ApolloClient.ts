import { onError } from '@apollo/client/link/error'
import { ApolloClient, InMemoryCache, from } from '@apollo/client'
import { createHttpLink } from 'apollo-link-http'
import Config from 'react-native-config'
import { setContext } from '@apollo/client/link/context'
import AsyncStorage from '@react-native-async-storage/async-storage'
//REVERSE PORTS adb reverse tcp:5051 tcp:5051
const httpLink = createHttpLink({
  uri: Config.API_URL,
  credentials: 'include'
})

const getToken = async () => {
  try {
    const value = await AsyncStorage.getItem('@accessToken')
    if (value !== null) {
      // value previously stored
    }
    console.log('accessToken', value)
    return value
  } catch (e) {
    // error reading value
    console.log(e)
  }
}

const authLink = setContext(async (_, { headers }) => {
  //get the authentication token
  const accessToken = await getToken()
  //return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `bearer ${accessToken}` : ''
    }
  }
})

// Log any GraphQL errors or network error that occurred
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    )
  }
  if (networkError) {
    console.log(`[Network error]: ${networkError}`)
  }
})

export const apoloCLient = new ApolloClient({
  link: from([errorLink, authLink, httpLink as any]),
  cache: new InMemoryCache()
})
