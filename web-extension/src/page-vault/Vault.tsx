import { Box, Center, Flex, Input, Text } from '@chakra-ui/react'

import React, { useEffect } from 'react'

let test = [
  {
    secret: 'JBSWY3DPEHPK3PXP',
    label: 'bitfinex',
    icon: 'https://chakra-ui.com/favicon.png'
  }
]

export default function Vault() {
  return (
    <Box>
      <Center>
        <Flex flexDirection="column" justifyItems="center">
          <Input
            w={['150px', '300px', '500px']}
            placeholder="Search vault"
            m={5}
          />

          <Flex backgroundColor="blue.200"></Flex>
        </Flex>
      </Center>
    </Box>
  )
}
