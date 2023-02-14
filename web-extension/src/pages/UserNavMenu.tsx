import React, { FunctionComponent } from 'react'

import {
  Button,
  ButtonGroup,
  Center,
  Heading,
  Stack,
  useColorModeValue
} from '@chakra-ui/react'

import { Trans } from '@lingui/macro'
import { device } from '@src/background/ExtensionDevice'

export const UserNavMenu: FunctionComponent = () => {
  const bg = useColorModeValue('teal.200', 'teal.700')
  return (
    <Stack direction="row" bgColor={bg} justify="center" p="10px">
      <Center>
        <Heading size={'sm'}>Logged as {device.state?.email}</Heading>
      </Center>
      <ButtonGroup spacing={4} variant="solid" m="10px">
        <Stack direction="column">
          <Button
            colorScheme="yellow"
            onClick={async () => {
              device.clearLockInterval()
              device.lock()
            }}
          >
            <Trans>Lock vault</Trans>
          </Button>
          <Button
            colorScheme="red"
            onClick={async () => {
              device.logout()
            }}
          >
            <Trans>Logout</Trans>
          </Button>
        </Stack>
      </ButtonGroup>
    </Stack>
  )
}
