import React, { FunctionComponent } from 'react'

import { Button, ButtonGroup, Stack } from '@chakra-ui/react'

import { InfoOutlineIcon } from '@chakra-ui/icons'
import { Link } from 'wouter'
import { AddTOTPSecretButton } from '@src/components/AddTOTPSecretButton'

export const NavMenu: FunctionComponent = () => {
  return (
    <Stack direction="row" bgColor="teal.200" justify="center" p="10px">
      <ButtonGroup spacing={4}>
        <Stack>
          <Link to="/">
            <Button colorScheme="teal">Secrets</Button>
          </Link>
          <AddTOTPSecretButton />
          <Link to="/settings">
            <Button colorScheme="blue">Settings</Button>
          </Link>
        </Stack>
      </ButtonGroup>
      <ButtonGroup spacing={4} variant="solid" m="10px">
        <Stack direction="column">
          <Link to="/devices">
            <Button>My devices</Button>
          </Link>

          <Link to="/about">
            <Button leftIcon={<InfoOutlineIcon />}>About</Button>
          </Link>

          <Button
            onClick={() => {
              chrome.tabs.create({ url: 'vault.html' })
            }}
          >
            My vault
          </Button>
        </Stack>
      </ButtonGroup>
    </Stack>
  )
}
