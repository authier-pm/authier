import { ReactNode, useEffect, useState } from 'react'

import { FaCheckCircle } from 'react-icons/fa'
import getStripe from '../utils/get-stripe'
import {
  Box,
  Heading,
  HStack,
  List,
  ListIcon,
  ListItem,
  Stack,
  useColorModeValue,
  VStack,
  Text,
  Center,
  Spinner
} from '@chakra-ui/react'

import Head from 'next/head'

import {
  CreateCheckoutSessionMutation,
  CreatePortalSessionMutation,
  useCreateCheckoutSessionMutation,
  useCreatePortalSessionMutation
} from './pricing.codegen'

import { useRouter } from 'next/router'
import { FetchResult } from '@apollo/client'

function PriceWrapper({ children }: { children: ReactNode }) {
  return (
    <Box
      mb={4}
      shadow="base"
      borderWidth="1px"
      alignSelf={{ base: 'center', lg: 'flex-start' }}
      borderColor={useColorModeValue('gray.200', 'gray.500')}
      borderRadius={'xl'}
    >
      {children}
    </Box>
  )
}

export default function PricingPage() {
  const router = useRouter()
  const { product, portal } = router.query
  const [loading, setLoading] = useState(false)

  const [createCheckoutSessionMutation] = useCreateCheckoutSessionMutation()

  const [createPortalSession, { data: portalData }] =
    useCreatePortalSessionMutation()

  const handleCheckout = async (type: string) => {
    setLoading(true)
    //Create a Checkout Session.
    let res: FetchResult<
      CreateCheckoutSessionMutation,
      Record<string, any>,
      Record<string, any>
    >
    try {
      res = await createCheckoutSessionMutation({
        variables: {
          product: type
        }
      })
    } catch (error) {
      console.error(error)
      router.push('/?error=true')
      return
    }

    // // Redirect to Checkout.
    const stripe = await getStripe()
    const { error } = await stripe!.redirectToCheckout({
      //   // Make the id field from the Checkout Session creation API response
      //   // available to this file, so you can provide it as parameter here
      //   // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
      sessionId: res.data?.me.createCheckoutSession as string
    })
    // // If `redirectToCheckout` fails due to a browser or network
    // // error, display the localized error message to your customer
    // // using `error.message`.
    console.warn(error.message)
    setLoading(false)
  }

  const handlePortal = async () => {
    setLoading(true)
    let res: FetchResult<
      CreatePortalSessionMutation,
      Record<string, any>,
      Record<string, any>
    >
    try {
      res = await createPortalSession()
    } catch (error) {
      console.error(error)
      router.push('/?error=true')
      return
    }

    window.location.href = res.data?.me.createPortalSession as string
    setLoading(false)
  }

  useEffect(() => {
    //TODO handle if product is not right string
    if (product) {
      handleCheckout(product as string)
    }

    if (portal) {
      handlePortal()
    }
  }, [])

  if (loading) {
    return (
      <Center height="88vh">
        <VStack>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
          <Heading>Loading</Heading>
        </VStack>
      </Center>
    )
  }

  return (
    <Box>
      <Head>
        <title>Authier - Pricing</title>
      </Head>
      <Box minH="90vh">
        <Box py={12}>
          <VStack spacing={2} textAlign="center">
            <Heading as="h1" fontSize="4xl">
              Pay per quantity
            </Heading>
            <Text fontSize="lg" color={'gray.500'}>
              Start small and pay only when you need to scale up.
            </Text>
          </VStack>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            textAlign="center"
            justify="center"
            spacing={{ base: 4, lg: 10 }}
            py={10}
          >
            <PriceWrapper>
              <Box py={4} px={12}>
                <Text fontWeight="500" fontSize="2xl">
                  Free tier
                </Text>
                <HStack justifyContent="center">
                  <Text fontSize="3xl" fontWeight="600">
                    $
                  </Text>
                  <Text fontSize="5xl" fontWeight="900">
                    0
                  </Text>
                  <Text fontSize="3xl" color="gray.500">
                    /month
                  </Text>
                </HStack>
              </Box>
              <VStack
                bg={useColorModeValue('gray.50', 'gray.700')}
                py={4}
                borderBottomRadius={'xl'}
              >
                <List spacing={3} textAlign="start" px={12}>
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="green.500" />3 TOTP
                    secrets
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="green.500" />
                    40 login secrets
                  </ListItem>
                </List>
                <Box w="80%" pt={7}>
                  Always free
                </Box>
              </VStack>
            </PriceWrapper>
            <PriceWrapper>
              <Box py={4} px={12}>
                <Text fontWeight="500" fontSize="2xl">
                  Credentials
                </Text>
                <HStack justifyContent="center">
                  <Text fontSize="3xl" fontWeight="600">
                    $
                  </Text>
                  <Text fontSize="5xl" fontWeight="900">
                    1
                  </Text>
                  <Text fontSize="3xl" color="gray.500">
                    /month
                  </Text>
                </HStack>
              </Box>
              <VStack
                bg={useColorModeValue('gray.50', 'gray.700')}
                py={4}
                borderBottomRadius={'xl'}
              >
                <List spacing={3} textAlign="start" px={12}>
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="green.500" />
                    additional 60 login secrets
                  </ListItem>
                </List>
              </VStack>
            </PriceWrapper>
            <PriceWrapper>
              <Box py={4} px={12}>
                <Text fontWeight="500" fontSize="2xl">
                  TOTP
                </Text>
                <HStack justifyContent="center">
                  <Text fontSize="3xl" fontWeight="600">
                    $
                  </Text>
                  <Text fontSize="5xl" fontWeight="900">
                    1
                  </Text>
                  <Text fontSize="3xl" color="gray.500">
                    /month
                  </Text>
                </HStack>
              </Box>
              <VStack
                bg={useColorModeValue('gray.50', 'gray.700')}
                py={4}
                borderBottomRadius={'xl'}
              >
                <List spacing={3} textAlign="start" px={12}>
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="green.500" />
                    additional 20 TOTP secrets
                  </ListItem>
                </List>
              </VStack>
            </PriceWrapper>
            <PriceWrapper>
              <Box position="relative">
                <Box
                  position="absolute"
                  top="-16px"
                  left="50%"
                  style={{ transform: 'translate(-50%)' }}
                >
                  <Text
                    textTransform="uppercase"
                    noOfLines={1}
                    bg={useColorModeValue('red.300', 'red.700')}
                    px={3}
                    py={1}
                    color={useColorModeValue('white', 'gray.100')}
                    fontSize="sm"
                    fontWeight="600"
                    rounded="xl"
                  >
                    Most Popular
                  </Text>
                </Box>
                <Box py={4} px={12}>
                  <Text fontWeight="500" fontSize="2xl">
                    TOTP and Credentials
                  </Text>
                  <HStack justifyContent="center">
                    <Text fontSize="3xl" fontWeight="600">
                      $
                    </Text>
                    <Text fontSize="5xl" fontWeight="900">
                      2
                    </Text>
                    <Text fontSize="3xl" color="gray.500">
                      /month
                    </Text>
                  </HStack>
                </Box>
                <VStack
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  py={4}
                  borderBottomRadius={'xl'}
                >
                  <List spacing={3} textAlign="start" px={12}>
                    <ListItem>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      additional 60 login secrets
                    </ListItem>
                    <ListItem>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      additional 20 TOTP secrets
                    </ListItem>
                  </List>
                </VStack>
              </Box>
            </PriceWrapper>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
