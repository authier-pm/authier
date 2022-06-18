import { ReactElement } from 'react'
import {
  Box,
  Image,
  Icon,
  Text,
  Stack,
  Flex,
  Fade,
  HStack,
  Heading,
  Center,
  VStack,
  SimpleGrid
} from '@chakra-ui/react'

import { useInView } from 'react-intersection-observer'

export default function Benefits() {
  const { ref, inView } = useInView({
    rootMargin: '-400px',
    triggerOnce: true
  })

  return (
    <Fade in={inView}>
      <Center ref={ref}>
        <SimpleGrid>
          <HStack spacing={20}>
            <Flex w={['lg', 'md', 'md']}>
              <Image
                rounded={'md'}
                alt={'feature image'}
                src="/assets/mobile-encryption-rafiki.svg"
                objectFit={'cover'}
              />
            </Flex>
            <Stack spacing={4}>
              <Heading>Encryption</Heading>
              <Text color={'gray.500'} fontSize={'lg'}>
                We use the latest encryption technology to protect your
                passwords.
              </Text>
            </Stack>
          </HStack>

          <HStack w="70vw" spacing={20}>
            <Stack spacing={4}>
              <Heading>Open Source</Heading>
              <Text color={'gray.500'} fontSize={'lg'}>
                We are open source and are always looking for new features.
              </Text>
            </Stack>
            <Flex w="lg">
              <Image
                rounded={'md'}
                alt={'feature image'}
                src="/assets/Open-source-rafiki.svg"
                objectFit={'cover'}
              />
            </Flex>
          </HStack>

          <HStack w="70vw" spacing={20}>
            <Flex w="lg">
              <Image
                rounded={'md'}
                alt={'feature image'}
                src="/assets/Devices-pana.svg"
                objectFit={'cover'}
              />
            </Flex>
            <Stack spacing={4}>
              <Heading>Cross platform</Heading>
              <Text color={'gray.500'} fontSize={'lg'}>
                We will be available on all major platforms like Mac, Windows,
                Linux, Android and IOS
              </Text>
            </Stack>
          </HStack>
        </SimpleGrid>
      </Center>
    </Fade>
  )
}
