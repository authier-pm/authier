import { ArrowForwardIcon } from '@chakra-ui/icons'
import {
  Heading,
  Avatar,
  Box,
  Center,
  Text,
  Stack,
  Button,
  Link,
  Badge,
  useColorModeValue,
  Icon,
  IconButton
} from '@chakra-ui/react'
import { MyDevicesQuery, useMyDevicesQuery } from '@src/pages/Devices.codegen'
import React from 'react'
import { IoIosPhonePortrait } from 'react-icons/io'
import { DeviceQuery } from '../../../shared/generated/graphqlBaseTypes'

const ListItem = (item: {
  id: string
  firstIpAddress: string
  lastIpAddress: string
  name: string
  lastGeoLocation: string
}) => {
  return (
    <Center py={6}>
      <Box
        maxW={'320px'}
        w={'full'}
        bg={useColorModeValue('white', 'gray.900')}
        boxShadow={'2xl'}
        rounded={'lg'}
        p={6}
        textAlign={'center'}
      >
        <Icon as={IoIosPhonePortrait} size={'xl'} w={20} h={20} />
        <Heading fontSize={'2xl'} fontFamily={'body'}>
          {item.name}
        </Heading>
        <Text fontWeight={600} color={'gray.500'} mb={4}>
          {item.lastIpAddress}
        </Text>

        <Stack align={'center'} justify={'center'} direction={'row'} mt={6}>
          <Badge px={2} py={1} colorScheme="green" fontWeight={'400'}>
            Master
          </Badge>
          <Badge px={2} py={1} fontWeight={'400'} colorScheme="purple">
            New
          </Badge>
        </Stack>

        <Button
          mt={5}
          flex={1}
          fontSize={'sm'}
          rounded={'full'}
          bg={'blue.400'}
          color={'white'}
          boxShadow={
            '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
          }
          _hover={{
            bg: 'blue.500'
          }}
          _focus={{
            bg: 'blue.500'
          }}
          aria-label="Search database"
          rightIcon={<ArrowForwardIcon />}
        >
          Device information
        </Button>
      </Box>
    </Center>
  )
}

export default function Devices() {
  const { data, loading, error } = useMyDevicesQuery()

  return (
    <>
      {data?.me?.devices.map((el) => {
        return <ListItem {...el} />
      })}
    </>
  )
}
