import { Box, Center, Flex, Input } from '@chakra-ui/react'
import { t } from '@lingui/macro'

import Head from 'next/head'
import React from 'react'

export default function DownloadPage() {
  return (
    <Box>
      <Head>
        <title>Authier - Downloads</title>
      </Head>
      <Center>
        <Flex flexDirection="column" justifyItems="center">
          <Input
            w={['150px', '300px', '500px']}
            placeholder={t`Search vault`}
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
