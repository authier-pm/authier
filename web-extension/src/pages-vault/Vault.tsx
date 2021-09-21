import React, { useContext, useEffect, useState } from 'react'
import {
  Box,
  Center,
  Flex,
  Input,
  Spinner,
  Text,
  Image,
  useColorModeValue,
  Stack,
  Heading,
  Avatar
} from '@chakra-ui/react'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { UserContext } from '@src/providers/UserProvider'

import { useEncryptedSecretsLazyQuery } from './Vault.codegen'
import cryptoJS from 'crypto-js'
import { ILoginCredentials, ITOTPSecret } from '@src/util/useBackgroundState'
import SidebarWithHeader from './SidebarWithHeader'
import { AuthsContext } from '@src/providers/AuthsProvider'

//@ts-expect-error
function Item({ icon, label }) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <Center py={5}>
      <Box
        maxW={'250px'}
        w="250px"
        h="auto"
        bg={useColorModeValue('white', 'gray.900')}
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        onMouseOver={() => setIsVisible(true)}
        onMouseOut={() => setIsVisible(false)}
      >
        <Box bg={'gray.100'} mt={-6} mx={-6} pos={'relative'}>
          <Image src={icon} w="100%" h="150px" />
          <Box
            display={isVisible ? 'block' : 'none'}
            zIndex={9}
            position="absolute"
            top={0}
            bgColor="blackAlpha.600"
            w="100%"
            h="150px"
          ></Box>
        </Box>
        <Flex
          flexDirection="row"
          align="center"
          justifyContent="flex-start"
          p={3}
        >
          <Text fontWeight={'bold'} fontSize={'lg'}>
            {label}
          </Text>
        </Flex>
      </Box>
    </Center>
  )
}

export default function Vault() {
  const { userId } = useContext(UserContext)
  const { masterPassword, savePasswordsToBg } = useContext(BackgroundContext)
  const { setAuths } = useContext(AuthsContext)
  const [totp, setTotp] = useState<[ITOTPSecret]>()
  const [credentials, setCredentials] = useState<[ILoginCredentials]>()

  const [encryptedData, { data, loading, error }] =
    useEncryptedSecretsLazyQuery({
      variables: {
        userId: userId as string
      }
    })

  useEffect(() => {
    if (userId) {
      encryptedData()
    }
  }, [userId])

  useEffect(() => {
    if (data && masterPassword) {
      data?.user?.secrets.forEach((i) => {
        if (i.kind === 'TOTP') {
          let loadedAuths = JSON.parse(
            cryptoJS.AES.decrypt(
              i.encrypted as string,
              masterPassword
            ).toString(cryptoJS.enc.Utf8)
          )
          setTotp(loadedAuths)
          setAuths(loadedAuths)
        } else if ('LOGIN_CREDENTIALS') {
          let loadCredentials = JSON.parse(
            cryptoJS.AES.decrypt(
              i.encrypted as string,
              masterPassword
            ).toString(cryptoJS.enc.Utf8)
          )
          setCredentials(loadCredentials)
          savePasswordsToBg(loadCredentials)
        }
      })
    }
  }, [data, masterPassword])

  if (loading) {
    return (
      <Center>
        <Spinner size="xl" />
      </Center>
    )
  }

  return (
    <SidebarWithHeader>
      <Center justifyContent={['flex-end', 'center', 'center']}>
        <Flex flexDirection="column">
          <Input
            w={['150px', '200', '300px', '350px', '400px', '500px']}
            placeholder="Search vault"
            m={5}
            _focus={{ backgroundColor: 'white' }}
          />

          <Flex flexDirection="row" flexWrap="wrap">
            {totp?.map((el) => {
              return <Item icon={el.icon} label={el.label} />
            })}
            {credentials?.map((el) => {
              return (
                <Flex
                  key={el.label}
                  boxShadow="lg"
                  flexDirection="column"
                  m={3}
                  w={180}
                  h={190}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Box boxSize={40} backgroundColor="blue.200" />
                  <Text fontSize={20}>{el.label}</Text>
                </Flex>
              )
            })}
          </Flex>
        </Flex>
      </Center>
    </SidebarWithHeader>
  )
}
