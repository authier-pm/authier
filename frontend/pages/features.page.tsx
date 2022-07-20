import Head from 'next/head'
import React from 'react'
import { AuPage } from '../components/AuPage'
import { Box, Image } from '@chakra-ui/react'
import { t } from '@lingui/macro'

import md from './features.md'
import { AuthierMarkdown } from './AuthierMarkdown'

export default function Features() {
  return (
    <>
      <Head>
        <title>Features</title>
      </Head>
      <AuPage heading={'Features'}>
        <Box m={3} p={3}>
          <AuthierMarkdown md={md}></AuthierMarkdown>
        </Box>
      </AuPage>
    </>
  )
}
