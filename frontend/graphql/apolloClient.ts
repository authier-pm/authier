import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  InMemoryCache
} from '@apollo/client'
import { errorLink } from '../../shared/errorLink'
import jwtDecode from 'jwt-decode'

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL

export let getTokenFromLocalStorage = async (): Promise<string | null> => {
  const accessToken = sessionStorage.getItem('access-token')
  return accessToken
}

export const getUserFromToken = async () => {
  return jwtDecode<{ userId: string }>(
    (await getTokenFromLocalStorage()) as string
  )
}

const httpLink = createHttpLink({
  uri: `${NEXT_PUBLIC_API_URL}/graphql`,
  credentials: 'include'
})

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  queryDeduplication: true
})
