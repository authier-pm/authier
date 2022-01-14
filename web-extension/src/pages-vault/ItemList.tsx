import { Button, IconButton } from '@chakra-ui/button'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { UnlockIcon, SettingsIcon, DeleteIcon } from '@chakra-ui/icons'
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
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import React, { useContext, useState } from 'react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { t } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { DeleteAlert } from '../components/vault/DeleteAlert'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { useDeleteEncryptedSecretMutation } from '../components/vault/ItemList.codegen'
import browser from 'webextension-polyfill'

function Item({ data }: { data: ILoginSecret | ITOTPSecret }) {
  const [isVisible, setIsVisible] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deleteEncryptedSecretMutation] = useDeleteEncryptedSecretMutation()
  const { deviceState } = useContext(DeviceStateContext)

  console.log(data)
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
            <Image src={data.iconUrl as string} />
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
            {data.kind === EncryptedSecretType.LOGIN_CREDENTIALS ? (
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
                if (!deviceState) {
                  throw new Error('deviceState is not set')
                }
                await deleteEncryptedSecretMutation({
                  variables: {
                    id: data.id
                  }
                })

                browser.storage.local.set({
                  backgroundState: {
                    ...deviceState,
                    secrets: deviceState.secrets.filter((s) => s.id !== data.id)
                  }
                })
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
          <Text fontWeight={'bold'} fontSize={'lg'} isTruncated>
            {data.label}
          </Text>

          <Link
            to={{
              pathname: `secret/${data.id}`,
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
  const { deviceState, LoginCredentials, TOTPSecrets } =
    useContext(DeviceStateContext)
  const [filterBy, setFilterBy] = useState('')

  return (
    <Flex flexDirection="column">
      <Input
        w={['300px', '350px', '400px', '500px']}
        placeholder={t`Search vault`}
        m="auto"
        onChange={(ev) => {
          setFilterBy(ev.target.value)
        }}
      />
      <Center justifyContent={['flex-end', 'center', 'center']}>
        <Flex flexDirection="column">
          <Flex flexDirection="row" flexWrap="wrap" m="auto">
            {TOTPSecrets?.filter(({ label, url }) => {
              return label.includes(filterBy) || url?.includes(filterBy)
            }).map((el, i) => {
              return <Item data={el as ITOTPSecret} key={el.label + i} />
            })}
            {LoginCredentials?.filter(({ label, url }) => {
              return label.includes(filterBy) || url?.includes(filterBy)
            }).map((el, i) => {
              return <Item key={el.label + i} data={el as ILoginSecret} />
            })}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  )
}
