import {
  Image,
  Text,
  Stack,
  Flex,
  Fade,
  HStack,
  Heading,
  Center,
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
          <HStack spacing={20} m="auto">
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
                Authier uses the similar proven encryption technology as the
                likes of bitwarden to protect your passwords with an extra
                attention to the additional layers like device management.
              </Text>
            </Stack>
          </HStack>

          <HStack w="70vw" spacing={20} m="auto">
            <Stack spacing={4}>
              <Heading>Open Source</Heading>
              <Text color={'gray.500'} fontSize={'lg'}>
                We are open source and are always adding new features and
                tweaking existing ones.
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

          <HStack w="70vw" spacing={20} m="auto">
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
                Authier is available on all major platforms like Mac, Windows,
                Linux, Android and IOS.
              </Text>
            </Stack>
          </HStack>
        </SimpleGrid>
      </Center>
    </Fade>
  )
}
