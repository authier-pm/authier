import { Box } from '@chakra-ui/react'
import Head from 'next/head'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import { PageHeading } from '../components/PageHeading'
import ChakraUIRenderer from 'chakra-ui-markdown-renderer'
import md from './privacy-policy.md'

// generated from https://app.freeprivacypolicy.com/download/f9567bd2-6453-4f1c-9e73-cd22e72d8fac
export default function Privacy() {
  return (
    <>
      <Head>
        <title>Authier - privacy</title>
      </Head>
      <PageHeading>Privacy policy</PageHeading>
      <Box m={3} p={3}>
        <ReactMarkdown components={ChakraUIRenderer()} children={md} />
      </Box>
    </>
  )
}
