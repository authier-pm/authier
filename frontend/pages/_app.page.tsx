import { ApolloProvider } from '@apollo/client'
import { useRouter } from 'next/dist/client/router'
import React from 'react'
import { toastifyConfig } from '../../shared/toastifyConfig'
import { apolloClient } from '../graphql/apolloClient'
import { ChakraLayout } from './layout/ChakraLayout'
import { ToastContainer, ToastTransitionProps } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function MyApp({ Component, pageProps }: { Component: any; pageProps: any }) {
  const router = useRouter()
  if (!router.isReady) {
    // A necessary hack as `const { appId } = router.query` is undefined on first render
    return null
  }

  return (
    <ApolloProvider client={apolloClient}>
      <ChakraLayout>
        {/* @ts-expect-error */}
        <ToastContainer
          {...(toastifyConfig('bottom-right') as ToastTransitionProps)}
        />

        <Component {...pageProps} />
      </ChakraLayout>
    </ApolloProvider>
  )
}

export default MyApp
