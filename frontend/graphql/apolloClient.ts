import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  InMemoryCache
} from '@apollo/client'
import { errorLink } from '../../shared/errorLink'
import jwtDecode from 'jwt-decode'

export let getTokenFromLocalStorage = async (): Promise<string | null> => {
  let test = sessionStorage.getItem('access-token')
  return test
}

export const getUserFromToken = async () => {
  return jwtDecode<{ userId: string }>(
    (await getTokenFromLocalStorage()) as string
  )
}

const httpLink = createHttpLink({
  uri: `http://localhost:5051/graphql`,
  credentials: 'include'
})

export const apolloClient = new ApolloClient({
  //@ts-expect-error
  link: ApolloLink.from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  queryDeduplication: true
})
