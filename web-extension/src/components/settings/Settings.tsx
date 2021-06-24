import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState
} from 'react'

import { browser } from 'webextension-polyfill-ts'

import {
  Box,
  ChakraProvider,
  CircularProgress,
  Flex,
  Button,
  Text
} from '@chakra-ui/react'

export const Settings: FunctionComponent = () => {
  return (
    <Flex>
      <Text>Ahoj</Text>
      <Button colorScheme="teal" size="xs">
        Button
      </Button>
    </Flex>
  )
}
