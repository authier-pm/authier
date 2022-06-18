import { ReactNode } from 'react'

import Head from 'next/head'
import {
  chakra,
  Box,
  GridItem,
  useColorModeValue,
  Text,
  Center,
  SimpleGrid,
  Container,
  Flex
} from '@chakra-ui/react'

import NextLink from 'next/link'
import { Link } from '../components/Link'
import { useRouter } from 'next/router'
import Success from '../components/Success'
import Error from '../components/Error'
import Testimonials from '../components/Testimonials'

import AboutSection from '../components/AboutSection'
import FeaturesSection from '../components/FeaturesSection'
import Benefits from '../components/Benefits'
export const Links = [
  'Features',
  'Pricing',
  'Blog',
  'Download',
  'FAQ',
  'Privacy policy'
]

export const NavLink = ({
  children,
  href
}: {
  children: ReactNode
  href: string
}) => (
  <Box
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('teal.100', 'teal.900')
    }}
  >
    <NextLink href={href}>{children}</NextLink>
  </Box>
)

export default function Home() {
  const router = useRouter()
  const { success, canceled, error } = router.query

  if (success) {
    return <Success />
  } else if (canceled || error) {
    return <Error />
  }

  return (
    <Box>
      <Head>
        <title>Authier</title>
      </Head>
      <Hero />
      <AboutSection />
      <Benefits />
      <Testimonials />
    </Box>
  )
}

const Hero = () => {
  return (
    <Flex
      px={8}
      py={24}
      mx="auto"
      bg='linear-gradient(#0000007f, rgba(255,255,255,.5)), url("/assets/silas-kohler-C1P4wHhQbjM-unsplash.jpg")'
      bgSize="cover"
      alignItems="center"
      w="full"
      minHeight="90vh"
      justifyContent="space-between"
    >
      <Container maxW="container.xl">
        <GridItem colSpan={{ base: 'auto', md: 4 }} maxW={550}>
          <Box
            as="form"
            mb={8}
            p={12}
            rounded="lg"
            shadow="xl"
            bgColor="whiteAlpha.300"
            bgBlendMode="darken"
            boxShadow="dark-lg"
            dropShadow="lg"
            border="none"
            borderBottom="0px"
            overflow="hidden"
          >
            <Center pb={0} color="white" flexDir="column">
              <chakra.h1
                mb={4}
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="bold"
                lineHeight={{ base: 'shorter', md: 'none' }}
                letterSpacing={{ base: 'normal', md: 'tight' }}
              >
                Ready to explore how easy authentication can be?
              </chakra.h1>
              <Link href="/download">
                <Text pt={2} fontSize="md" mt={3}>
                  It takes less than a minute to set up, just download the
                  browser extension and start
                </Text>
              </Link>
            </Center>
            <SimpleGrid
              columns={1}
              px={6}
              py={4}
              spacing={4}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
            ></SimpleGrid>
          </Box>
        </GridItem>
        <GridItem
          colSpan={{ base: 'auto', lg: 7 }}
          textAlign={{ base: 'center', lg: 'left' }}
          color={'cyan.900'}
        >
          <chakra.p
            mb={{ base: 10, md: 4 }}
            fontSize={{ base: 'lg', md: 'xl' }}
            fontWeight="thin"
            color="gray.500"
            letterSpacing="wider"
          ></chakra.p>
        </GridItem>
      </Container>
    </Flex>
  )
}
