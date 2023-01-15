import React from 'react'
import { HStack, Spinner, Heading, View, useColorModeValue } from 'native-base'

export const Loading = () => {
  const bgColor = useColorModeValue('white', 'black')

  return (
    <View background={bgColor} alignItems={'center'} justifyContent="center">
      <HStack space={2} justifyContent="center">
        <Spinner accessibilityLabel="Loading posts" />
        <Heading color="primary.500" fontSize="md">
          Loading
        </Heading>
      </HStack>
    </View>
  )
}
