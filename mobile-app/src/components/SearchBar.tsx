import { Icon, Input, useColorModeValue } from 'native-base'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'

export const SearchBar = ({ setFilterBy }) => {
  return (
    <Input
      autoCapitalize="none"
      placeholder="Search"
      bg={useColorModeValue('warmGray.50', 'coolGray.800')}
      borderRadius={10}
      flexGrow={1}
      flex={1}
      py="3"
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
      onChangeText={(text) => setFilterBy(text)}
    />
  )
}
