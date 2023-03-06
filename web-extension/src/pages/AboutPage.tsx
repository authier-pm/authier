import React from 'react'
import pkg from '../../package.json'
import { Trans } from '@lingui/macro'
import { Center, Stack } from '@chakra-ui/layout'
import { Heading, Text } from '@chakra-ui/react'

export const AboutPage: React.FC = () => {
  return (
    <Center m={2} p={2} minW={300} minH={'500px'}>
      <Stack direction="column">
        <Heading size="md">Authier web extension</Heading>
        <Text fontSize={'large'}>
          <Trans>Version: {pkg.version}</Trans>
        </Text>
      </Stack>
    </Center>
  )
}
