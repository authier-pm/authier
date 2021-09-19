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

export default function Vault() {
  const { userId } = useContext(UserContext)
  const { masterPassword } = useContext(BackgroundContext)
  const [totp, setTotp] = useState<[ITOTPSecret]>()
  const [credencials, setCredentials] = useState<[ILoginCredentials]>()

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
          setTotp(
            JSON.parse(
              cryptoJS.AES.decrypt(
                i.encrypted as string,
                masterPassword
              ).toString(cryptoJS.enc.Utf8)
            )
          )
        } else if ('LOGIN_CREDENTIALS') {
          setCredentials(
            JSON.parse(
              cryptoJS.AES.decrypt(
                i.encrypted as string,
                masterPassword
              ).toString(cryptoJS.enc.Utf8)
            )
          )
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
                <Flex key={el.label} boxShadow="lg" flexDirection="column">
                  <Image src={el.icon} alt="Segun Adebayo" />
                  <Text>{el.label}</Text>
                </Flex>
              )
            })}
          </Flex>
        </Flex>
      </Center>
    </SidebarWithHeader>
  )
}
