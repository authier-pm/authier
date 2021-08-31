import { ApolloProvider } from '@apollo/client'
import { useRouter } from 'next/dist/client/router'
import React from 'react'
import { apolloClient } from '../graphql/apolloClient'
import { ChakraLayout } from './layout/ChakraLayout'

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  if (!router.isReady) {
    // A necessary hack as `const { appId } = router.query` is undefined on first render
    return null
  }

  return (
    <ApolloProvider client={apolloClient}>
      <ChakraLayout>
        <Component {...pageProps} />
      </ChakraLayout>
    </ApolloProvider>
  )
}

export default MyApp
