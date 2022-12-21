import React, { FunctionComponent } from 'react'

import { Button, ButtonGroup, Stack, useColorModeValue } from '@chakra-ui/react'

import { InfoOutlineIcon } from '@chakra-ui/icons'
import { Link } from 'wouter'
import { AddTOTPSecretButton } from '@src/components/pages/AddTOTPSecretButton'

export const NavMenu: FunctionComponent = () => {
  const bg = useColorModeValue('teal.200', 'teal.700')

  return (
    <Stack direction="row" bgColor={bg} justify="center" p="10px">
      <ButtonGroup spacing={4}>
        <Stack>
          <Link to="/">
            <Button colorScheme="teal">Secrets</Button>
          </Link>
          <AddTOTPSecretButton />
        </Stack>
      </ButtonGroup>
      <ButtonGroup spacing={4} variant="solid" m="10px">
        <Stack direction="column">
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
