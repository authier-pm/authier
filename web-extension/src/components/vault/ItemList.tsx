import { IconButton } from '@chakra-ui/button'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { UnlockIcon, SettingsIcon } from '@chakra-ui/icons'
import {
  Center,
  Box,
  Flex,
  Text,
  Image,
  Input,
  Spinner
} from '@chakra-ui/react'
import { AuthsContext } from '@src/providers/AuthsProvider'
import { UserContext } from '@src/providers/UserProvider'
import { ILoginCredentials, ITOTPSecret } from '@src/util/useBackgroundState'
import React, { useContext, useEffect, useState } from 'react'
import cryptoJS from 'crypto-js'
import { useMeLazyQuery } from '@src/pages-vault/Vault.codegen'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { t } from '@lingui/macro'
import { Link } from 'react-router-dom'

function VaultItem({
  icon,
  label,
  data
}: {
  label: string
  icon: string | undefined
  data: ILoginCredentials
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
              onClick={() => chrome.tabs.create({ url: data.originalUrl })}
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
          <Link
            to={{
              pathname: `list/${label}`,
              state: { data: data }
            }}
          >
            <IconButton
              size="sm"
              display={isVisible ? 'block' : 'none'}
              aria-label="open item"
              colorScheme="gray"
              icon={<SettingsIcon />}
            />
          </Link>
        </Flex>
      </Box>
    </Center>
  )
}

export const ItemList = () => {
  const { userId } = useContext(UserContext)
  const { masterPassword, savePasswordsToBg } = useContext(BackgroundContext)
  const { setAuths } = useContext(AuthsContext)
  const [totp, setTotp] = useState<[ITOTPSecret]>()
  const [credentials, setCredentials] = useState<[ILoginCredentials]>()
  const [filterBy, setFilterBy] = useState('')
  const [encryptedData, { data, loading, error }] = useMeLazyQuery({})

  useEffect(() => {
    if (userId) {
      encryptedData()
    }
  }, [userId])

  useEffect(() => {
    if (data && masterPassword) {
      data?.me?.secrets.forEach((i) => {
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
    <Flex flexDirection="column">
      <Input
        w={['300px', '350px', '400px', '500px']}
        placeholder={t`Search vault`}
        m="auto"
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
                    //@ts-expect-error
                    data={el}
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
                    data={el}
                  />
                )
              })}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  )
}
