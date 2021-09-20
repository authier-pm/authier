import React, { useContext, useEffect, useState } from 'react'
import {
  Box,
  Center,
  Flex,
  Input,
  Spinner,
  Text,
  Image
} from '@chakra-ui/react'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { UserContext } from '@src/providers/UserProvider'

import { useEncryptedSecretsLazyQuery } from './Vault.codegen'
import cryptoJS from 'crypto-js'
import { ILoginCredentials, ITOTPSecret } from '@src/util/useBackgroundState'
import SidebarWithHeader from './SidebarWithHeader'
import { AuthsContext } from '@src/providers/AuthsProvider'

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
      <Center>
        <Flex flexDirection="column" justifyItems="center">
          <Input
            w={['150px', '300px', '500px']}
            placeholder="Search vault"
            m={5}
            _focus={{ backgroundColor: 'white' }}
          />

          <Flex flexDirection="row" flexWrap="wrap">
            {totp?.map((el) => {
              return (
                <Flex
                  key={el.label}
                  boxShadow="lg"
                  flexDirection="column"
                  w={180}
                  h={190}
                  m={3}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Image boxSize={40} src={el.icon} alt={el.label} />
                  <Text fontSize={20}>{el.label}</Text>
                </Flex>
              )
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
