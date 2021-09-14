import { Box } from '@chakra-ui/react'

import Head from 'next/head'
import React from 'react'
import { LoginCard } from '../components/LoginCard'

export default function Login() {
  return (
    <Box>
      <Head>
        <title>Authier - Login</title>
      </Head>
      <LoginCard />
    </Box>
  )
}
