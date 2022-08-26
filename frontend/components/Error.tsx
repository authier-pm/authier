import {
  Box,
  Flex,
  Heading,
  Link,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { CloseIcon } from '@chakra-ui/icons'

export default function Error({
  message = 'There was an error. Please try again.'
}: {
  message?: string
}) {
  return (
    <Box textAlign="center" py={10} px={6} height={'86vh'}>
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
      <Text>{message}</Text>
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
