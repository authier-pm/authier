import { Box } from '@chakra-ui/react'
import Head from 'next/head'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import { AuPage } from '../components/AuPage'
import ChakraUIRenderer from 'chakra-ui-markdown-renderer'
import md from './privacy-policy.md'
import { t } from '@lingui/macro'
import { chakraCustomTheme } from '../lib/chakraTheme'

// generated from https://app.freeprivacypolicy.com/download/f9567bd2-6453-4f1c-9e73-cd22e72d8fac
export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Authier - privacy</title>
      </Head>
      <AuPage heading={t`Privacy policy`}>
        <Box m={3} p={3}>
          <ReactMarkdown
            components={ChakraUIRenderer(chakraCustomTheme)}
            children={md}
          />
        </Box>
      </AuPage>
    </>
  )
}
