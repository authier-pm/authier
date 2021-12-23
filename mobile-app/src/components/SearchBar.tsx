import { Icon, Input } from 'native-base'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'

export const SearchBar = () => {
  return (
    <Input
      m={5}
      mr={3}
      placeholder="Search"
      variant="filled"
      // bg="gray.100"
      borderRadius={10}
      w="85%"
      py="3"
      px="2"
      placeholderTextColor="gray.500"
      _hover={{ bg: 'gray.200', borderWidth: 0 }}
      borderWidth="0"
      InputLeftElement={
        <Icon
          ml="2"
          size="5"
          color="gray.500"
          as={<Ionicons name="ios-search" />}
        />
      }
    />
  )
}
