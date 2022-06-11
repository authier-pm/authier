import {
  Box,
  Flex,
  Heading,
  Link,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { CloseIcon } from '@chakra-ui/icons'
import React from 'react'

export default function Error() {
  return (
    <Box textAlign="center" py={10} px={6}>
      <Box display="inline-block">
        <Flex
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          bg={'red.500'}
          rounded={'50px'}
          w={'55px'}
          h={'55px'}
          textAlign="center"
        >
          <CloseIcon boxSize={'20px'} color={'white'} />
        </Flex>
      </Box>
      <Heading as="h2" size="xl" mt={6} mb={2}>
        Error
      </Heading>
      <Text color={'gray.500'}>There was an error. Please try again.</Text>
      <Link
        href={'/'}
        color={useColorModeValue('brand.600', 'brand.400')}
        _hover={{ textDecor: 'underline' }}
      >
        Go home
      </Link>
    </Box>
  )
}
