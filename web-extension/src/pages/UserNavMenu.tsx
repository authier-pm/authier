import React, { FunctionComponent } from 'react'

import { Button, ButtonGroup, Center, Heading, Stack } from '@chakra-ui/react'

import { Trans } from '@lingui/macro'
import { device } from '@src/background/ExtensionDevice'

export const UserNavMenu: FunctionComponent = () => {
  return (
    <Stack direction="row" bgColor="teal.200" justify="center" p="10px">
      <Center>
        <Heading size={'sm'}>Logged as {device.state?.email}</Heading>
      </Center>
      <ButtonGroup spacing={4} variant="solid" m="10px">
        <Stack direction="column">
          {/* <Button
            colorScheme="yellow"
            onClick={async () => {
              device.lock()
            }}
          >
            <Trans>Lock vault</Trans>
          </Button> */}
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
