import { Box, Center, Flex, Input, Text } from '@chakra-ui/react'

import Head from 'next/head'
import React from 'react'
import { useUseMeQuery } from './layout/useMe.codegen'

let test = [
  {
    secret: 'JBSWY3DPEHPK3PXP',
    label: 'bitfinex',
    icon: 'https://chakra-ui.com/favicon.png'
  }
]

export default function Vault() {
  const { data, loading, error } = useUseMeQuery()

  console.log(data)
  return (
    <Box>
      <Head>
        <title>Authier - Vault</title>
      </Head>
      <Center>
        <Flex flexDirection="column" justifyItems="center">
          <Input
            w={['150px', '300px', '500px']}
            placeholder="Search vault"
            m={5}
          />

          <Flex backgroundColor="blue.200">
            {test.map((el) => {
              return (
                <Flex flexDirection="column">
                  <Text>{el.label}</Text>
                  <Text>{el.secret}</Text>
                </Flex>
              )
            })}
          </Flex>
        </Flex>
      </Center>
    </Box>
  )
}
