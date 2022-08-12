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
      <Center ref={ref} mb={10}>
        <SimpleGrid>
          <HStack w="70vw" spacing={15}>
            <Flex w="lg">
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
                Authier uses the same proven encryption technology as other
                state-of-the-art password managers to protect your passwords
                with an extra attention to the additional layers like device
                management.
              </Text>
            </Stack>
          </HStack>

          <HStack w="70vw" spacing={15}>
            <Stack spacing={4}>
              <Heading>Open Source</Heading>
              <Text color={'gray.500'} fontSize={'lg'}>
                We are open source and are always adding new features and
                tweaking existing ones. Feel free to contribute if you think you
                can improve it. We always accept a good PR.
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

          <HStack w="70vw" spacing={15}>
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
                Authier is available on all major platforms: <br /> Mac,
                Windows, Linux, Android and IOS.
              </Text>
            </Stack>
          </HStack>
        </SimpleGrid>
      </Center>
    </Fade>
  )
}
