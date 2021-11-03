import React, { FunctionComponent, useContext } from 'react'

import { Button, ButtonGroup, Stack } from '@chakra-ui/react'
import browser from 'webextension-polyfill'
import { removeToken } from '@src/util/accessTokenExtension'

import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { Trans } from '@lingui/macro'

export const UserNavMenu: FunctionComponent = () => {
  const { logoutUser, lockVault } = useContext(BackgroundContext)

  return (
    <Stack direction="row" bgColor="teal.200" justify="center" p="10px">
      <ButtonGroup spacing={4} variant="solid" m="10px">
        <Stack direction="column">
          <Button
            colorScheme="yellow"
            onClick={async () => {
              lockVault()
            }}
          >
            <Trans>Lock vault</Trans>
          </Button>
          <Button
            colorScheme="red"
            onClick={async () => {
              await removeToken()
              await browser.storage.local.clear()

              logoutUser()
            }}
          >
            <Trans>Logout</Trans>
          </Button>
        </Stack>
      </ButtonGroup>
    </Stack>
  )
}
