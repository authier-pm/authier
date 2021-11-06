import { Box } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import Head from 'next/head'
import React from 'react'
import { AuPage } from '../components/AuPage'

export default function Pricing() {
  return (
    <>
      <Head>
        <title>Authier - Pricing</title>
      </Head>
      <Box bgGradient="linear(to-l, teal.100, teal.400)" minH="90vh">
        <AuPage heading={t`Pricing`}>Test</AuPage>
      </Box>
    </>
  )
}
