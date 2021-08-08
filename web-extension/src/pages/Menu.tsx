import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState
} from 'react'

import { Flex, Button, ButtonGroup } from '@chakra-ui/react'

import { InfoOutlineIcon, AddIcon } from '@chakra-ui/icons'
import { Link } from 'wouter'

export const Menu: FunctionComponent = () => {
  return (
    <ButtonGroup
      display="flex"
      variant="outline"
      flexDirection="column"
      mt="10px"
    >
      <Link to={'/devices'}>
        <Button>My devices</Button>
      </Link>
      <Link to={'/settings'}>
        <Button>Settings</Button>
      </Link>
      <Button leftIcon={<InfoOutlineIcon />}>About</Button>
    </ButtonGroup>
  )
}
