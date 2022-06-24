import { ReactElement } from 'react'

import {
  SimpleGrid,
  Image,
  Flex,
  Heading,
  Text,
  Stack,
  StackDivider,
  Icon,
  useColorModeValue,
  Center,
  Fade
} from '@chakra-ui/react'
import {
  IoLogoBitcoin,
  IoLaptopOutline,
  IoDocumentLockOutline
} from 'react-icons/io5'
import { useInView } from 'react-intersection-observer'

interface FeatureProps {
  text: string
  iconBg: string
  icon?: ReactElement
}

const Feature = ({ text, icon, iconBg }: FeatureProps) => {
  return (
    <Stack direction={'row'} align={'center'}>
      <Flex
        w={8}
        h={8}
        align={'center'}
        justify={'center'}
        rounded={'full'}
        bg={iconBg}
      >
        {icon}
      </Flex>
      <Text fontWeight={600}>{text}</Text>
    </Stack>
  )
}

export default function AboutSection() {
  const { ref, inView } = useInView({
    rootMargin: '-200px',
    triggerOnce: true
  })
  return (
    <Fade in={inView}>
      <Center h={'90vh'} m="25" ref={ref}>
        <SimpleGrid gridGap={'10px'} columns={{ base: 1, md: 2 }} spacing={20}>
          <Stack spacing={4}>
            <Heading>Authier</Heading>
            <Text color={'gray.500'} fontSize={'lg'}>
              Open-source password manager with a focus on security and trust.
              Builded for the most demanding users.
            </Text>
            <Stack
              spacing={4}
              divider={
                <StackDivider
                  borderColor={useColorModeValue('gray.100', 'gray.700')}
                />
              }
            >
              <Feature
                icon={
                  <Icon
                    as={IoDocumentLockOutline}
                    color={'yellow.500'}
                    w={5}
                    h={5}
                  />
                }
                iconBg={useColorModeValue('yellow.100', 'yellow.900')}
                text={'Security'}
              />
              <Feature
                icon={
                  <Icon as={IoLogoBitcoin} color={'green.500'} w={5} h={5} />
                }
                iconBg={useColorModeValue('green.100', 'green.900')}
                text={'Payment with crypto'}
              />
              <Feature
                icon={
                  <Icon as={IoLaptopOutline} color={'purple.500'} w={5} h={5} />
                }
                iconBg={useColorModeValue('purple.100', 'purple.900')}
                text={'Cross-platform'}
              />
            </Stack>
          </Stack>
          <Flex>
            <Image
              rounded={'md'}
              alt={'feature image'}
              src="/assets/2fa-panna.svg"
              objectFit={'cover'}
            />
          </Flex>
        </SimpleGrid>
      </Center>
    </Fade>
  )
}
