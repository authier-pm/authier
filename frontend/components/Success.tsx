import { Box, Heading, Text } from '@chakra-ui/react'
import { CheckCircleIcon } from '@chakra-ui/icons'
import React from 'react'

export default function Success() {
  return (
    <Box textAlign="center" py={10} px={6}>
      <CheckCircleIcon boxSize={'50px'} color={'green.500'} />
      <Heading as="h2" size="xl" mt={6} mb={2}>
        Success
      </Heading>
      <Text color={'gray.500'}>Thank you for subscribing!</Text>
    </Box>
  )
}
