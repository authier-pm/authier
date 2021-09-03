import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  InMemoryCache
} from '@apollo/client'
import { errorLink } from '../../shared/errorLink'
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL

const httpLink = createHttpLink({
  uri: `${NEXT_PUBLIC_API_URL}/graphql`
})

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  queryDeduplication: true
})
