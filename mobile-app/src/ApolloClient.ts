import { onError } from '@apollo/client/link/error'
import { ApolloClient, InMemoryCache, from } from '@apollo/client'
import { createHttpLink } from 'apollo-link-http'
import Config from 'react-native-config'
import { setContext } from '@apollo/client/link/context'
import { getAccessToken } from '../util/accessTokenUtilz'
//REVERSE PORTS adb reverse tcp:5051 tcp:5051
const httpLink = createHttpLink({
  uri: Config.API_URL,
  credentials: 'include'
})

const authLink = setContext(async (_, { headers }) => {
  //get the authentication token
  console.log('affwe')
  const accessToken = await getAccessToken()
  console.log('accessToken', accessToken)
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
