import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState
} from 'react'

import { Flex, Button, ButtonGroup, Stack } from '@chakra-ui/react'
import browser from 'webextension-polyfill'
import { removeToken } from '@src/util/accessTokenExtension'

import { InfoOutlineIcon, AddIcon } from '@chakra-ui/icons'
import { Link } from 'wouter'
import { AddAuthSecretButton } from '@src/components/AddAuthSecretButton'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { useIsLoggedInQuery } from '@src/popup/Popup.codegen'

export const Menu: FunctionComponent = () => {
  const { refetch } = useIsLoggedInQuery()

  return (
    <Stack direction="row" bgColor="teal.200" justify="center" pt="10px">
      <ButtonGroup spacing={4} m="10px">
        <Stack>
          <Link to={'/'}>
            <Button colorScheme="blue">Secrets</Button>
          </Link>
          <AddAuthSecretButton />
          <Button
            colorScheme={'teal'}
            onClick={async () => {
              // setIsAuth(false)
              await browser.storage.local.clear()
              removeToken()
              chrome.runtime.sendMessage({
                action: BackgroundMessageType.clear
              })
              refetch()
            }}
          >
            Logout
          </Button>
        </Stack>
      </ButtonGroup>
      <ButtonGroup spacing={4} variant="solid" m="10px">
        <Stack direction="column">
          <Link to={'/devices'}>
            <Button>My devices</Button>
          </Link>
          <Link to={'/settings'}>
            <Button>Settings</Button>
          </Link>
          <Button leftIcon={<InfoOutlineIcon />}>About</Button>
        </Stack>
      </ButtonGroup>
    </Stack>
  )
}
