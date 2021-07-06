import { Box } from '@chakra-ui/react'
import Head from 'next/head'
import React from 'react'
import { PageHeading } from '../components/PageHeading'

export default function Pricing() {
  return (
    <>
      <Box bgGradient="linear(to-l, teal.100, teal.400)" minH="90vh">
        <Head>
          <title>Authier - Pricing</title>
        </Head>
        <PageHeading>Pricing</PageHeading>
      </Box>
    </>
  )
}
