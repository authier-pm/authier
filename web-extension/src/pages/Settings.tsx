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

export const Settings: FunctionComponent = () => {
  return (
    <ButtonGroup
      display="flex"
      variant="outline"
      flexDirection="column"
      mt="10px"
    >
      <Button leftIcon={<InfoOutlineIcon />}>About</Button>
      <Button leftIcon={<AddIcon />}>Add device</Button>
    </ButtonGroup>
  )
}
