import React from 'react'
import { ChakraLayout } from './layout/ChakraLayout'

function MyApp({ Component, pageProps }) {
  return (
    <ChakraLayout>
      <Component {...pageProps} />
    </ChakraLayout>
  )
}

MyApp.getInitialProps = async () => {
  // A bit of a hack as `const { appId } = router.query` is undefined on first render
  // https://nextjs.org/docs/messages/empty-object-getInitialProps
  // https://github.com/vercel/next.js/discussions/11484
  return {}
}

export default MyApp
