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
  Avatar,
  IconButton
} from '@chakra-ui/react'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { UserContext } from '@src/providers/UserProvider'

import { useMeLazyQuery } from './Vault.codegen'
import cryptoJS from 'crypto-js'
import { ILoginCredentials, ITOTPSecret } from '@src/util/useBackgroundState'
import SidebarWithHeader from './SidebarWithHeader'
import { AuthsContext } from '@src/providers/AuthsProvider'
import { SettingsIcon, UnlockIcon } from '@chakra-ui/icons'
import { t } from '@lingui/macro'

function VaultItem({
  icon,
  label
}: {
  label: string
  icon: string | undefined
}) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <Center py={5} m={3}>
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
        <Box bg={'gray.100'} h="90%" pos={'relative'}>
          <Center h={130}>
            <Image src={icon} />
          </Center>
          <Flex
            display={isVisible ? 'flex' : 'none'}
            alignItems="center"
            justifyContent="center"
            zIndex={9}
            position="absolute"
            top={0}
            bgColor="blackAlpha.600"
            w="100%"
            h="full"
          >
            <IconButton
              aria-label="open item"
              colorScheme="blackAlpha"
              icon={<UnlockIcon />}
            />
          </Flex>
        </Box>
        <Flex
          flexDirection="row"
          align="center"
          justifyContent="space-between"
          p={4}
        >
          <Text fontWeight={'bold'} fontSize={'lg'}>
            {label}
          </Text>
          <IconButton
            size="sm"
            display={isVisible ? 'block' : 'none'}
            aria-label="open item"
            colorScheme="gray"
            icon={<SettingsIcon />}
          />
        </Flex>
      </Box>
    </Center>
  )
}

export function Vault() {
  const { userId } = useContext(UserContext)
  const { masterPassword, savePasswordsToBg } = useContext(BackgroundContext)
  const { setAuths } = useContext(AuthsContext)
  const [totp, setTotp] = useState<[ITOTPSecret]>()
  const [credentials, setCredentials] = useState<[ILoginCredentials]>()
  const [filterBy, setFilterBy] = useState('')
  const [encryptedData, { data, loading, error }] = useMeLazyQuery({
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
      <Input
        w={['150px', '200', '300px', '350px', '400px', '500px']}
        placeholder={t`Search vault`}
        m={5}
        _focus={{ backgroundColor: 'white' }}
        onChange={(ev) => {
          setFilterBy(ev.target.value)
        }}
      />
      <Center justifyContent={['flex-end', 'center', 'center']}>
        <Flex flexDirection="column">
          <Flex flexDirection="row" flexWrap="wrap">
            {totp
              ?.filter(({ label, originalUrl }) => {
                return (
                  label.includes(filterBy) || originalUrl.includes(filterBy)
                )
              })
              .map((el, i) => {
                return (
                  <VaultItem
                    icon={el.icon}
                    label={el.label}
                    key={el.label + i}
                  />
                )
              })}
            {credentials
              ?.filter(({ label, originalUrl }) => {
                return (
                  label.includes(filterBy) || originalUrl.includes(filterBy)
                )
              })
              .map((el, i) => {
                return (
                  <VaultItem
                    //@ts-expect-error
                    icon={el.favIconUrl}
                    label={el.label}
                    key={el.label + i}
                  />
                )
              })}
          </Flex>
        </Flex>
      </Center>
    </SidebarWithHeader>
  )
}
