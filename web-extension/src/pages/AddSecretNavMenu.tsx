import React, { FunctionComponent, useContext } from 'react'

import { Button, ButtonGroup, Stack, useColorModeValue } from '@chakra-ui/react'

import { AddIcon, InfoOutlineIcon } from '@chakra-ui/icons'
import { Link } from 'wouter'
import { AddTOTPSecretButton } from '@src/components/pages/AddTOTPSecretButton'
import { openVaultTab } from '@src/AuthLinkPage'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'

export const AddSecretNavMenu: FunctionComponent = () => {
  const bg = useColorModeValue('teal.200', 'teal.700')
  const { currentURL } = useContext(DeviceStateContext)

  return (
    <Stack direction="row" bgColor={bg} justify="center" p="10px">
      <ButtonGroup spacing={4}>
        <Stack>
          <Button
            colorScheme="teal"
            leftIcon={<AddIcon />}
            onClick={() => {
              openVaultTab('/addItem?url=' + currentURL)
            }}
          >
            Add manually
          </Button>
          <AddTOTPSecretButton />
        </Stack>
      </ButtonGroup>
    </Stack>
  )
}
