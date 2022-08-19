import React from 'react'
import { HStack, Spinner, Heading, View, useColorModeValue } from 'native-base'

export const Loading = () => {
  return (
    <View
      alignItems={'center'}
      justifyContent="center"
      backgroundColor={useColorModeValue('black', 'white')}
    >
      <HStack space={2} justifyContent="center">
        <Spinner accessibilityLabel="Loading posts" />
        <Heading color="primary.500" fontSize="md">
          Loading
        </Heading>
      </HStack>
    </View>
  )
}
