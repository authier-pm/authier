import { ColorModeScript } from '@chakra-ui/react'
import NextDocument, { Html, Head, Main, NextScript } from 'next/document'
import { chakraCustomTheme } from '../lib/chakraTheme'

export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/assets/logos/favicon.png" />
          <style>
            {`
            body {
              overflow: hidden;
            }
            #__next {
              display: flex;
              flex-direction: column;
              height: 100vh;
              overflow-x: hidden;
              width: 100%;
            }
          `}
          </style>
        </Head>
        <body>
          <ColorModeScript
            initialColorMode={chakraCustomTheme.config.initialColorMode}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
