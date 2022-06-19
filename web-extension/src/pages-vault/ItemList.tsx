import { IconButton } from '@chakra-ui/button'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { UnlockIcon, SettingsIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons'
import {
  Center,
  Box,
  Flex,
  Text,
  Image,
  Input,
  useDisclosure,
  Stat
} from '@chakra-ui/react'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import React, { useContext, useState } from 'react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { t } from '@lingui/macro'
import { Link, useNavigate } from 'react-router-dom'
import { DeleteAlert } from '../components/vault/DeleteAlert'
import { useDeleteEncryptedSecretMutation } from '../components/vault/ItemList.codegen'
import { SecretItemIcon } from '@src/components/SecretItemIcon'
import { RefreshSecretsButton } from '@src/components/RefreshSecretsButton'
import { device } from '@src/background/ExtensionDevice'
import { useDebounce } from './useDebounce'

function Item({ data }: { data: ILoginSecret | ITOTPSecret }) {
  const [isVisible, setIsVisible] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deleteEncryptedSecretMutation] = useDeleteEncryptedSecretMutation()
  const { deviceState } = useContext(DeviceStateContext)
  if (!deviceState) {
    return null
  }
  return (
    <Center py={5} m={['auto', '3']}>
      <Box
        w="250px"
        h="195px"
        bg={useColorModeValue('white', 'gray.800')}
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        onMouseOver={() => setIsVisible(true)}
        onMouseOut={() => setIsVisible(false)}
      >
        <Box bg={'gray.100'} h="70%" pos={'relative'}>
          <Center h={130}>
            <SecretItemIcon {...data} />
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
            {data.url ? (
              <IconButton
                aria-label="open item"
                colorScheme="blackAlpha"
                icon={<UnlockIcon />}
                onClick={() => chrome.tabs.create({ url: data.url })}
              />
            ) : null}

            <DeleteIcon
              cursor={'pointer'}
              boxSize={26}
              padding={1.5}
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
              deleteItem={async () => {
                await deleteEncryptedSecretMutation({
                  variables: {
                    id: data.id
                  }
                })
                await device.state?.removeSecret(data.id)
              }}
            />
          </Flex>
        </Box>
        <Flex
          flexDirection="row"
          align="center"
          justifyContent="space-between"
          p={4}
        >
          <Text fontWeight={'bold'} fontSize={'lg'} noOfLines={1}>
            {data.label}
          </Text>

          <Link
            to={{
              pathname: `secret/${data.id}`
            }}
            state={{ data: data }}
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

// TODO virtualize this
export const ItemList = () => {
  const { LoginCredentials, TOTPSecrets } = useContext(DeviceStateContext)
  const [filterBy, setFilterBy] = useState('')
  const navigate = useNavigate()
  const debouncedSearchTerm = useDebounce(filterBy, 400)

  return (
    <Flex flexDirection="column">
      <Center>
        <Input
          w={['300px', '350px', '400px', '500px']}
          placeholder={t`Search vault`}
          m="auto"
          onChange={(ev) => {
            setFilterBy(ev.target.value)
          }}
        />

        <Center px={3}>
          <Stat ml="auto" whiteSpace={'nowrap'}>
            {LoginCredentials.length + TOTPSecrets.length} {t`secrets`}
          </Stat>

          <RefreshSecretsButton />
        </Center>
        <IconButton
          aria-label="Add item"
          icon={<AddIcon />}
          rounded={'full'}
          onClick={async () => navigate('/addItem')}
        />
      </Center>

      <Center justifyContent={['flex-end', 'center', 'center']}>
        <Flex flexDirection="column">
          <Flex flexDirection="row" flexWrap="wrap" m="auto">
            {TOTPSecrets?.filter(({ label, url }) => {
              return (
                label.includes(debouncedSearchTerm) ||
                url?.includes(debouncedSearchTerm)
              )
            }).map((el, i) => {
              return <Item data={el as ITOTPSecret} key={el.label + i} />
            })}
            {LoginCredentials?.filter(({ label, url }) => {
              return (
                label.includes(debouncedSearchTerm) ||
                url?.includes(debouncedSearchTerm)
              )
            }).map((el, i) => {
              return <Item key={el.label + i} data={el as ILoginSecret} />
            })}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  )
}
