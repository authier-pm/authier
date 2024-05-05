import React from 'react'
import pkg from '../../package.json'
import { Trans } from '@lingui/macro'

import { Center, Heading, Stack, Text } from '@chakra-ui/react'

export const AboutPage: React.FC = () => {
  return (
    <Center m={2} p={2} minW={300} minH={'60%'}>
      <Stack direction="column">
        <Heading size="md">Authier web extension</Heading>
        <Text fontSize={'large'}>
          <Trans>Version: {pkg.version}</Trans>
        </Text>
      </Stack>
    </Center>
  )
}
