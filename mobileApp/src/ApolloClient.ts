import { onError } from '@apollo/client/link/error';
import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { createHttpLink } from 'apollo-link-http';
import Config from 'react-native-config';

const httpLink = createHttpLink({
  uri: Config.API_URL,
});

// Log any GraphQL errors or network error that occurred
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  }
  if (networkError) {
    console.log(`[Network error]: ${networkError}`);
  }
});

export const apoloCLient = new ApolloClient({
  link: from([errorLink, httpLink as any]),
  cache: new InMemoryCache(),
});
