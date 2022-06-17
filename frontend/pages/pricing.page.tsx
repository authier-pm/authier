import React, { ReactNode, useState } from 'react'

import { CheckIcon } from '@chakra-ui/icons'
import getStripe from '../utils/get-stripe'
import {
  Box,
  Button,
  Heading,
  HStack,
  List,
  ListIcon,
  ListItem,
  Stack,
  useColorModeValue,
  VStack,
  Text,
  Tooltip
} from '@chakra-ui/react'
import { t } from '@lingui/macro'
import Head from 'next/head'

import { AuPage } from '../components/AuPage'
import { useCreateCheckoutSessionMutation } from './pricing.codegen'

import { useRouter } from 'next/router'
import Error from '../components/Error'

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

function ToolTipButton({
  userId,
  plan,
  handleCheckout
}: {
  userId: string | string[] | undefined
  plan: string
  handleCheckout: (type: string) => Promise<void>
}) {
  return (
    <Tooltip
      isDisabled={userId ? true : false}
      label="Visit this page through yout vault"
    >
      <span>
        <Button
          disabled={!userId}
          w="full"
          colorScheme="red"
          onClick={() => handleCheckout(plan)}
        >
          Buy
        </Button>
      </span>
    </Tooltip>
  )
}

const pricingPlan = {
  Credentials: 'prod_LquWXgjk6kl5sM',
  TOTP: 'prod_LquVrkwfsXjTAL',
  TOTP_Credentials: 'prod_Lp3NU9UcNWduBm'
}

export default function PricingPage() {
  const router = useRouter()
  const { userId } = router.query

  const [loading, setLoading] = useState(false)

  const [
    createCheckoutSessionMutation,
    { data, loading: sessionLoading, error: sessionError }
  ] = useCreateCheckoutSessionMutation()

  const handleCheckout = async (type: string) => {
    setLoading(true)

    //Create a Checkout Session.
    const response = await createCheckoutSessionMutation({
      variables: {
        product: type,
        userId: userId as string
      }
    })

    if (sessionError) {
      console.error(sessionError.message)
      router.push('/?error=true')
      return
    }
    console.log(response)

    // // Redirect to Checkout.
    const stripe = await getStripe()
    const { error } = await stripe!.redirectToCheckout({
      //   // Make the id field from the Checkout Session creation API response
      //   // available to this file, so you can provide it as parameter here
      //   // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
      sessionId: response.data?.createCheckoutSession as string
    })
    // // If `redirectToCheckout` fails due to a browser or network
    // // error, display the localized error message to your customer
    // // using `error.message`.
    // console.warn(error.message)
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Authier - Pricing</title>
      </Head>
      <Box bgGradient="linear(to-l, teal.100, teal.400)" height="auto">
        <AuPage heading={t`Pricing`}>
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
                      <ListIcon as={CheckIcon} color="green.500" />3 TOTP
                      secrets
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckIcon} color="green.500" />
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
                      <ListIcon as={CheckIcon} color="green.500" />
                      additional 60 login secrets
                    </ListItem>
                  </List>
                  <Box w="80%" pt={7}>
                    <ToolTipButton
                      userId={userId}
                      plan={pricingPlan.Credentials}
                      handleCheckout={handleCheckout}
                    />
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
                      <ListIcon as={CheckIcon} color="green.500" />
                      additional 20 TOTP secrets
                    </ListItem>
                  </List>
                  <Box w="80%" pt={7}>
                    <ToolTipButton
                      userId={userId}
                      plan={pricingPlan.TOTP}
                      handleCheckout={handleCheckout}
                    />
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
                      noOfLines={1}
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
                        <ListIcon as={CheckIcon} color="green.500" />
                        additional 60 login secrets
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckIcon} color="green.500" />
                        additional 20 TOTP secrets
                      </ListItem>
                    </List>
                    <Box w="80%" pt={7}>
                      <ToolTipButton
                        userId={userId}
                        plan={pricingPlan.TOTP_Credentials}
                        handleCheckout={handleCheckout}
                      />
                    </Box>
                  </VStack>
                </Box>
              </PriceWrapper>
            </Stack>
          </Box>
        </AuPage>
      </Box>
    </>
  )
}
