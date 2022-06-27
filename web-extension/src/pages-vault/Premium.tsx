import { ReactNode, useState } from 'react'
import {
  Box,
  Stack,
  HStack,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  List,
  ListItem,
  ListIcon,
  Button
} from '@chakra-ui/react'
import { FaCheck } from 'react-icons/fa'
import React from 'react'
import { useCreateCheckoutSessionVaultMutation } from './Premium.codegen'

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

export default function Premium() {
  const [loading, setLoading] = useState(false)
  const [
    createCheckoutSessionMutation,
    { data, loading: sessionLoading, error }
  ] = useCreateCheckoutSessionVaultMutation()

  const handleCheckout = async () => {
    setLoading(true)
    // Create a Checkout Session.
    const response = await createCheckoutSessionMutation({
      variables: {
        product: '2'
      }
    })

    console.log(response)

    // // Redirect to Checkout.
    // const stripe = await getStripe()
    // const { error } = await stripe!.redirectToCheckout({
    //   // Make the id field from the Checkout Session creation API response
    //   // available to this file, so you can provide it as parameter here
    //   // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
    //   sessionId: response.id
    // })
    // // If `redirectToCheckout` fails due to a browser or network
    // // error, display the localized error message to your customer
    // // using `error.message`.
    // console.warn(error.message)
    setLoading(false)
  }

  return (
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
        direction={{ base: 'column', md: 'column', lg: 'row' }}
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
                <ListIcon as={FaCheck} color="green.500" />3 TOTP secrets
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheck} color="green.500" />
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
                <ListIcon as={FaCheck} color="green.500" />
                additional 60 login secrets
              </ListItem>
            </List>
            <Box w="80%" pt={7}>
              <Button w="full" colorScheme="red" variant="outline">
                Buy
              </Button>
            </Box>
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
                <ListIcon as={FaCheck} color="green.500" />
                additional 20 TOTP secrets
              </ListItem>
            </List>
            <Box w="80%" pt={7}>
              <Button w="full" colorScheme="red" variant="outline">
                Buy
              </Button>
            </Box>
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
                bg={useColorModeValue('red.300', 'red.700')}
                px={3}
                py={1}
                color={useColorModeValue('gray.900', 'gray.300')}
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
                  <ListIcon as={FaCheck} color="green.500" />
                  additional 60 login secrets
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheck} color="green.500" />
                  additional 20 TOTP secrets
                </ListItem>
              </List>
              <Box w="80%" pt={7}>
                <Button w="full" colorScheme="red" onClick={handleCheckout}>
                  Checkout
                </Button>
              </Box>
            </VStack>
          </Box>
        </PriceWrapper>
      </Stack>
    </Box>
  )
}
