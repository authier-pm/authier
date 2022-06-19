import Head from 'next/head'
import React from 'react'
import { AuPage } from '../components/AuPage'
import { Box, Image } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import ReactMarkdown from 'react-markdown'
import ChakraUIRenderer from 'chakra-ui-markdown-renderer'

import md from './features.md'
import remarkGfm from 'remark-gfm'
import { chakraCustomTheme } from '../lib/chakraTheme'

export default function Features() {
  return (
    <>
      <Head>
        <title>Features</title>
      </Head>
      <AuPage heading={'Features'}>
        <Box m={3} p={3}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={ChakraUIRenderer(chakraCustomTheme)}
          >
            {md}
          </ReactMarkdown>
        </Box>
      </AuPage>
    </>
  )
}
