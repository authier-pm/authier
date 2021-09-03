import { Box } from '@chakra-ui/react'
import { useRouter } from 'next/dist/client/router'
import Head from 'next/head'
import React from 'react'
import { LoginCard } from '../components/LoginCard'

export default function Test() {
  return (
    <Box>
      <Head>
        <title>Authier - Login</title>
      </Head>
      <LoginCard />
    </Box>
  )
}
