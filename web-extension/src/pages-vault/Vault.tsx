import React, { useContext, useState } from 'react'
import {
  Box,
  Center,
  Flex,
  Input,
  Text,
  Image,
  useColorModeValue,
  IconButton
} from '@chakra-ui/react'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import SidebarWithHeader from './SidebarWithHeader'

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
  const { backgroundState } = useContext(BackgroundContext)

  const [filterBy, setFilterBy] = useState('')

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
            {backgroundState?.totpSecrets
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
            {backgroundState?.loginCredentials
              ?.filter(({ label, originalUrl }) => {
                return (
                  label.includes(filterBy) || originalUrl.includes(filterBy)
                )
              })
              .map((el, i) => {
                return (
                  <VaultItem
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
