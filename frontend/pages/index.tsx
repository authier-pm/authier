import React, { ReactNode } from 'react'

import Head from 'next/head'
import {
  chakra,
  Box,
  GridItem,
  useColorModeValue,
  Button,
  Text,
  Center,
  Flex,
  SimpleGrid,
  VisuallyHidden,
  Input
} from '@chakra-ui/react'

import NextLink from 'next/link'
export const Links = ['Features', 'Pricing', 'FAQ', 'Privacy policy']

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
    color={'green.200'}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('brand.800', 'brand.100')
    }}
  >
    <NextLink href={href}>{children}</NextLink>
  </Box>
)

export default function Home() {
  return (
    <>
      <Head>
        <title>Authier</title>
      </Head>
      <SignUpHero />
    </>
  )
}

const SignUpHero = () => {
  return (
    <Center
      px={8}
      py={24}
      mx="auto"
      bg='linear-gradient(#0000007f, rgba(255,255,255,.5)), url("/assets/silas-kohler-C1P4wHhQbjM-unsplash.jpg")'
      bgSize="cover"
      minH="90vh"
    >
      <SimpleGrid
        alignItems="center"
        w={{ base: 'full', xl: 11 / 12 }}
        columns={{ base: 1, lg: 11 }}
        gap={{ base: 0, lg: 24 }}
        mx="auto"
      >
        <GridItem
          colSpan={{ base: 'auto', lg: 7 }}
          textAlign={{ base: 'center', lg: 'left' }}
        >
          <chakra.h1
            mb={4}
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="bold"
            lineHeight={{ base: 'shorter', md: 'none' }}
            color={useColorModeValue('gray.900', 'gray.200')}
            letterSpacing={{ base: 'normal', md: 'tight' }}
          >
            Ready to start using the smartest 2FA?
          </chakra.h1>
          <chakra.p
            mb={{ base: 10, md: 4 }}
            fontSize={{ base: 'lg', md: 'xl' }}
            fontWeight="thin"
            color="gray.500"
            letterSpacing="wider"
          ></chakra.p>
        </GridItem>
        <GridItem colSpan={{ base: 'auto', md: 4 }} maxW={550}>
          <Box
            as="form"
            mb={6}
            rounded="lg"
            shadow="xl"
            bgColor="whiteAlpha.300"
            bgBlendMode="darken"
            boxShadow="dark-lg"
            dropShadow="lg"
          >
            <Center pb={0} color={useColorModeValue('gray.700', 'gray.600')}>
              <Text pt={2} fontSize="md" mt={3}>
                Two fields should suffice
              </Text>
            </Center>
            <SimpleGrid
              columns={1}
              px={6}
              py={4}
              spacing={4}
              borderBottom="solid 1px"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
              <Flex>
                <VisuallyHidden>First Name</VisuallyHidden>
                <Input
                  mt={0}
                  type="text"
                  placeholder="First Name"
                  required
                  bgColor="white"
                />
              </Flex>
              <Flex>
                <VisuallyHidden>Email Address</VisuallyHidden>
                <Input
                  mt={0}
                  type="email"
                  placeholder="Email Address"
                  required
                  bgColor="white"
                />
              </Flex>
              <Flex>
                <VisuallyHidden>Password</VisuallyHidden>
                <Input
                  mt={0}
                  type="password"
                  placeholder="Password"
                  required
                  bgColor="white"
                />
              </Flex>
              <Button colorScheme="teal" w="full" py={2} type="submit">
                Sign up for free
              </Button>
            </SimpleGrid>
          </Box>
          <chakra.p fontSize="xs" textAlign="center" color="gray.600">
            By signing up you agree to our{' '}
            <chakra.a color="brand.500">Terms of Service</chakra.a>
          </chakra.p>
        </GridItem>
      </SimpleGrid>
    </Center>
  )
}
