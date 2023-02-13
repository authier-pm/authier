import React from 'react'
import {
  Heading,
  Avatar,
  Box,
  Center,
  Button,
  useColorModeValue
} from '@chakra-ui/react'
import { device } from '@src/background/ExtensionDevice'
import { MD5 } from 'crypto-js'
import browser from 'webextension-polyfill'

const page_url = process.env.PAGE_URL as string

export default function ProfileCard() {
  const email = device.state?.email as string

  return (
    <Center py={6}>
      <Box
        maxW={'320px'}
        w={'full'}
        bg={useColorModeValue('white', 'gray.800')}
        boxShadow={'2xl'}
        rounded={'lg'}
        p={6}
        textAlign={'center'}
      >
        <Avatar
          size={'xl'}
          src={`https://www.gravatar.com/avatar/${MD5(email)}}`}
          mb={4}
          pos={'relative'}
          _after={{
            content: '""',
            w: 4,
            h: 4,
            bg: 'green.300',
            border: '2px solid white',
            rounded: 'full',
            pos: 'absolute',
            bottom: 0,
            right: 3
          }}
        />
        <Heading fontSize={'2xl'} fontFamily={'body'}>
          {email}
        </Heading>

        <Button
          onClick={() =>
            browser.tabs.create({
              url: `${page_url}/pricing?portal=true`
            })
          }
          mt={8}
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
        >
          Subscriptions
        </Button>
      </Box>
    </Center>
  )
}
