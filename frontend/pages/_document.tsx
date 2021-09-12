import { ColorModeScript } from '@chakra-ui/react'
import NextDocument, { Html, Head, Main, NextScript } from 'next/document'
import { chakraCustomTheme } from '../../shared/chakraCustomTheme'

export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/assets/logos/favicon.png" />
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
