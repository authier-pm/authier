import { Box, Center, Flex, Input, Image, Link, Text } from '@chakra-ui/react'
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
          <Link href="https://chrome.google.com/webstore/detail/authier/padmmdghcflnaellmmckicifafoenfdi">
            <Image src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/YT2Grfi9vEBa2wAPzhWa.png" />
          </Link>

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
          <Text>Other browsers coming soon</Text>
        </Flex>
      </Center>
    </Box>
  )
}
