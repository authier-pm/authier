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
import { useByeQuery } from './Settings.codegen'

export const Settings: FunctionComponent = () => {
  const { data, loading, error } = useByeQuery({ fetchPolicy: 'network-only' })

  if (data) {
    console.log(data)
  }

  if (error) {
    console.log(error)
  }

  if (loading) {
    return <div>Loading</div>
  }

  if (!data) {
    console.log('no data')
  }

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
