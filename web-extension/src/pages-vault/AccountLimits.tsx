import React, { ReactNode } from 'react'

import {
  Box,
  Button,
  Heading,
  HStack,
  List,
  ListIcon,
  ListItem,
  Stack,
  Text,
  useColorModeValue,
  VStack
} from '@chakra-ui/react'
import { FaCheck } from 'react-icons/fa'
import { useMeExtensionQuery } from './AccountLimits.codegen'

function PriceWrapper({ children }: { children: ReactNode }) {
  return (
    <Box
      mb={4}
      shadow="base"
      borderWidth="1px"
      alignSelf={{ base: 'center', lg: 'flex-start' }}
      borderColor={useColorModeValue('gray.200', 'gray.500')}
      borderRadius={'xl'}
      rounded={'xl'}
      boxShadow={'lg'}
      m="auto"
      bg={useColorModeValue('white', 'gray.900')}
    >
      {children}
    </Box>
  )
}

const page_url = process.env.PAGE_URL as string

export const AccountLimits = () => {
  const { data, loading, error } = useMeExtensionQuery()

  return (
    <Box>
      <VStack spacing={2} textAlign="center">
        <Heading as="h1" fontSize="4xl">
          Current plan
        </Heading>
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
              <Button
                w="full"
                colorScheme="red"
                variant="outline"
                onClick={() =>
                  chrome.tabs.create({
                    url: `${page_url}/pricing?userId=${data?.me?.id}`
                  })
                }
              >
                Upgrade
              </Button>
            </Box>
          </VStack>
        </PriceWrapper>
      </Stack>
    </Box>
  )
}
