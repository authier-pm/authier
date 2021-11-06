import { Button, IconButton } from '@chakra-ui/button'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { UnlockIcon, SettingsIcon } from '@chakra-ui/icons'
import {
  Center,
  Box,
  Flex,
  Text,
  Image,
  Input,
  CloseButton,
  useDisclosure
} from '@chakra-ui/react'
import { ILoginCredentials, ITOTPSecret } from '@src/util/useBackgroundState'
import React, { useContext, useState } from 'react'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { t } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { DeleteAlert } from './DeleteAlert'

function VaultItem({
  icon,
  label,
  data,
  deleteItem
}: {
  label: string
  icon: string | undefined
  data: ILoginCredentials | ITOTPSecret
  deleteItem: () => void
}) {
  const [isVisible, setIsVisible] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Center py={5} m={['auto', '3']}>
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

            <CloseButton
              overflow={'visible'}
              backgroundColor={'red.400'}
              _hover={{ backgroundColor: 'red.500' }}
              position={'absolute'}
              right="0"
              top="inherit"
              onClick={onOpen}
            />

            <DeleteAlert
              isOpen={isOpen}
              onClose={onClose}
              deleteItem={deleteItem}
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
  const { backgroundState, saveLoginCredentials, saveTOTPSecrets } =
    useContext(BackgroundContext)
  const [filterBy, setFilterBy] = useState('')

  const removeLoginCredential = (label: string) => {
    saveLoginCredentials(
      backgroundState?.loginCredentials.filter(
        (item) => item.label !== label
      ) as ILoginCredentials[]
    )
  }

  const removeTOTPSecret = (label: string) => {
    saveTOTPSecrets(
      backgroundState?.totpSecrets.filter(
        (item) => item.label !== label
      ) as ITOTPSecret[]
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
          <Flex flexDirection="row" flexWrap="wrap" m="auto">
            {backgroundState?.totpSecrets
              ?.filter(({ label, originalUrl }) => {
                return (
                  label.includes(filterBy) || originalUrl.includes(filterBy)
                )
              })
              .map((el, i) => {
                return (
                  <VaultItem
                    data={el}
                    icon={el.icon}
                    label={el.label}
                    key={el.label + i}
                    deleteItem={() => removeTOTPSecret(el.label)}
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
                    data={el}
                    deleteItem={() => removeLoginCredential(el.label)}
                  />
                )
              })}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  )
}
