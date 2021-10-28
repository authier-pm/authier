import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react'

import { Flex, Button, ButtonGroup, Stack } from '@chakra-ui/react'
import browser from 'webextension-polyfill'
import { removeToken } from '@src/util/accessTokenExtension'

import { InfoOutlineIcon, AddIcon } from '@chakra-ui/icons'
import { Link } from 'wouter'
import { AddTOTPSecretButton } from '@src/components/AddTOTPSecretButton'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { useIsLoggedInQuery } from '@src/popup/Popup.codegen'
import { BackgroundContext } from '@src/providers/BackgroundProvider'

export const NavMenu: FunctionComponent = () => {
  const { logoutUser, lockVault } = useContext(BackgroundContext)

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

          <Button
            colorScheme="red"
            onClick={async () => {
              await removeToken()
              await browser.storage.local.clear()

              logoutUser()
            }}
          >
            Logout
          </Button>
          <Button
            colorScheme="yellow"
            onClick={async () => {
              lockVault()
            }}
          >
            Lock vault
          </Button>
          <Link to="/about">
            <Button leftIcon={<InfoOutlineIcon />}>About</Button>
          </Link>
        </Stack>
      </ButtonGroup>
    </Stack>
  )
}
