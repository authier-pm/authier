import { Box, Center, Flex, Input, Text } from '@chakra-ui/react'
import { useRouter } from 'next/dist/client/router'

import Head from 'next/head'
import React, { useEffect } from 'react'
import { useUseMeQuery } from './layout/useMe.codegen'
import { useEncryptedSecretsLazyQuery } from './vault.codegen'

let test = [
  {
    secret: 'JBSWY3DPEHPK3PXP',
    label: 'bitfinex',
    icon: 'https://chakra-ui.com/favicon.png'
  }
]

export default function Vault() {
  //const { data: meData, loading: meLoading, error: meError } = useUseMeQuery()
  //const [getSecrets, { data, loading, error }] = useEncryptedSecretsLazyQuery()
  const router = useRouter()

  // useEffect(() => {
  //   if (meData?.me?.id && !meLoading) {
  //     getSecrets({ variables: { userId: meData.me.id } })
  //   }
  // }, [meData?.me?.id, loading])

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
            {/* {test.map((el) => {
              return (
                <Flex flexDirection="column">
                  <Text>{el.label}</Text>
                  <Text>{el.secret}</Text>
                </Flex>
              )
            })} */}
          </Flex>
        </Flex>
      </Center>
    </Box>
  )
}
