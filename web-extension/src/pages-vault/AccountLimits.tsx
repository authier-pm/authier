import { ReactNode, useState } from 'react'

import {
  Box,
  Button,
  HStack,
  List,
  ListIcon,
  ListItem,
  useColorModeValue,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex
} from '@chakra-ui/react'
import { FaCheckCircle } from 'react-icons/fa'
import { useLimitsQuery } from '@shared/graphql/AccountLimits.codegen'
import ProfileCard from '@src/components/vault/ProfileCard'
import browser from 'webextension-polyfill'
import { getTokenFromLocalStorage } from '@src/util/accessTokenExtension'
import { Txt, TxtNowrap } from '@src/components/util/Txt'

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
      bg={useColorModeValue('cyan.800', 'gray.900')}
    >
      {children}
    </Box>
  )
}

const page_url = process.env.PAGE_URL as string

export const AccountLimits = () => {
  const { data } = useLimitsQuery({
    fetchPolicy: 'cache-and-network'
  })
  const [refreshAccountTooltip, setRefreshAccountTooltip] = useState(false)
  return (
    <Box m={4}>
      <HStack spacing={10} justifyContent="center" alignItems={'center'}>
        <ProfileCard
          refreshAccountTooltip={refreshAccountTooltip}
          setRefreshAccountTooltip={setRefreshAccountTooltip}
        />

        <TableContainer>
          <Table size="lg">
            <Thead>
              <Tr>
                <Th>Type</Th>
                <Th isNumeric>Current count</Th>
                <Th isNumeric>Your limit</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>Credentials</Td>
                <Td isNumeric>
                  {
                    data?.me.encryptedSecrets.filter(
                      (i) => i.kind === 'LOGIN_CREDENTIALS'
                    ).length
                  }
                </Td>
                <Td isNumeric>{data?.me.loginCredentialsLimit}</Td>
              </Tr>
              <Tr>
                <Td>TOTP</Td>
                <Td isNumeric>
                  {
                    data?.me.encryptedSecrets.filter((i) => i.kind === 'TOTP')
                      .length
                  }
                </Td>
                <Td isNumeric>{data?.me.TOTPlimit}</Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </HStack>

      <Flex
        direction={{ base: 'column', md: 'row' }}
        textAlign="center"
        justify="center"
        gap={4}
        wrap={'wrap'}
        py={10}
      >
        <PriceWrapper>
          <Box px={12}>
            <TxtNowrap fontWeight="500" fontSize="2xl">
              Free tier
            </TxtNowrap>
            <HStack justifyContent="center">
              <Txt fontSize="3xl" fontWeight="600">
                $
              </Txt>
              <Txt fontSize="5xl" fontWeight="900">
                0
              </Txt>
              <Txt fontSize="3xl" color="gray.500" whiteSpace={'nowrap'}>
                /month
              </Txt>
            </HStack>
          </Box>
          <VStack
            bg={useColorModeValue('gray.50', 'gray.700')}
            py={4}
            borderBottomRadius={'xl'}
          >
            <List spacing={3} textAlign="start" px={12}>
              <ListItem>
                <ListIcon as={FaCheckCircle} color="green.500" />3 TOTP secrets
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
            <TxtNowrap fontWeight="500" fontSize="2xl">
              Credentials
            </TxtNowrap>
            <HStack justifyContent="center">
              <Txt fontSize="3xl" fontWeight="600">
                $
              </Txt>
              <Txt fontSize="5xl" fontWeight="900">
                1
              </Txt>
              <Txt fontSize="3xl" color="gray.500" whiteSpace={'nowrap'}>
                /month
              </Txt>
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
                additional 250 login secrets
              </ListItem>
            </List>
            <Button
              disabled={!data?.me.id}
              w="80%"
              colorScheme="red"
              onClick={async () => {
                const token = await getTokenFromLocalStorage()
                browser.tabs.create({
                  url: `${page_url}/pricing?acToken=${token}`
                })
                setRefreshAccountTooltip(true)
              }}
            >
              Buy
            </Button>
          </VStack>
        </PriceWrapper>
        <PriceWrapper>
          <Box py={4} px={12}>
            <TxtNowrap fontWeight="500" fontSize="2xl">
              TOTP
            </TxtNowrap>
            <HStack justifyContent="center">
              <Txt fontSize="3xl" fontWeight="600">
                $
              </Txt>
              <Txt fontSize="5xl" fontWeight="900">
                1
              </Txt>
              <Txt fontSize="3xl" color="gray.500" whiteSpace={'nowrap'}>
                /month
              </Txt>
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
                additional 100 TOTP secrets
              </ListItem>
            </List>
            <Button
              disabled={!data?.me.id}
              w="80%"
              colorScheme="red"
              onClick={async () => {
                const token = await getTokenFromLocalStorage()
                browser.tabs.create({
                  url: `${page_url}/pricing?acToken=${token}`
                })
                setRefreshAccountTooltip(true)
              }}
            >
              Buy
            </Button>
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
              <Txt
                textTransform="uppercase"
                noOfLines={1}
                bg={useColorModeValue('red.300', 'red.700')}
                px={3}
                py={1}
                color={useColorModeValue('cyan.800', 'gray.100')}
                fontSize="sm"
                fontWeight="600"
                rounded="xl"
              >
                Most Popular
              </Txt>
            </Box>
            <Box py={4} px={12}>
              <TxtNowrap fontWeight="500" fontSize="2xl">
                TOTP and Credentials
              </TxtNowrap>
              <HStack justifyContent="center">
                <Txt fontSize="3xl" fontWeight="600">
                  $
                </Txt>
                <Txt fontSize="5xl" fontWeight="900">
                  2
                </Txt>
                <Txt fontSize="3xl" color="gray.500" whiteSpace={'nowrap'}>
                  /month
                </Txt>
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
                  additional 250 login secrets
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  additional 100 TOTP secrets
                </ListItem>
              </List>
              <Button
                disabled={!data?.me.id}
                w="80%"
                colorScheme="red"
                onClick={async () => {
                  const token = await getTokenFromLocalStorage()
                  browser.tabs.create({
                    url: `${page_url}/pricing?acToken=${token}`
                  })
                  setRefreshAccountTooltip(true)
                }}
              >
                Buy
              </Button>
            </VStack>
          </Box>
        </PriceWrapper>
      </Flex>
    </Box>
  )
}
