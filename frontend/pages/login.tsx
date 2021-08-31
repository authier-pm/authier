import { Box } from '@chakra-ui/react'
import { useRouter } from 'next/dist/client/router'
import Head from 'next/head'
import React from 'react'
import { LoginCard } from '../components/LoginCard'

export default function Test() {
  const r = useRouter()

  return (
    <Box>
      <Head>
        <title>Authier - FAQ</title>
      </Head>
      <LoginCard />
    </Box>
  )
}
