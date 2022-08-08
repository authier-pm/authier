import { IconButton } from '@chakra-ui/button'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { UnlockIcon, SettingsIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons'
import {
  Center,
  Box,
  Flex,
  Text,
  Input,
  useDisclosure,
  Stat,
  useColorMode,
  Tooltip,
  Spinner,
  VStack
} from '@chakra-ui/react'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import React, { useContext, useEffect, useState } from 'react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { t } from '@lingui/macro'
import { Link, useNavigate } from 'react-router-dom'
import { DeleteAlert } from '../components/vault/DeleteAlert'
import { SecretItemIcon } from '@src/components/SecretItemIcon'
import { RefreshSecretsButton } from '@src/components/RefreshSecretsButton'
import { device } from '@src/background/ExtensionDevice'
import { useDebounce } from './useDebounce'
import { useDeleteEncryptedSecretMutation } from './VaultList.codegen'
import { useSyncSettingsQuery } from '@src/components/vault/settings/VaultConfig.codegen'
import { VirtualizedList } from '@src/components/vault/VirtualizedList'

export function VaultListItem({ data }: { data: ILoginSecret | ITOTPSecret }) {
  const [isVisible, setIsVisible] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deleteEncryptedSecretMutation] = useDeleteEncryptedSecretMutation()
  const { deviceState } = useContext(DeviceStateContext)
  if (!deviceState) {
    return null
  }
  return (
    <Center key={data.id} py={5} m={['auto', '3']}>
      <Box
        w='250px'
        h='195px'
        bg={useColorModeValue('white', 'gray.800')}
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        onMouseOver={() => setIsVisible(true)}
        onMouseOut={() => setIsVisible(false)}
      >
        <Box bg={'gray.100'} h='70%' pos={'relative'}>
          <Center h={130}>
            <SecretItemIcon {...data} />
          </Center>
          <Flex
            display={isVisible ? 'flex' : 'none'}
            alignItems='center'
            justifyContent='center'
            zIndex={9}
            position='absolute'
            top={0}
            bgColor='blackAlpha.600'
            w='100%'
            h='full'
          >
            {data.url ? (
              <IconButton
                aria-label='open item'
                colorScheme='blackAlpha'
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
              right='0'
              top='inherit'
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
          flexDirection='row'
          align='center'
          justifyContent='space-between'
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
              size='sm'
              display={isVisible ? 'block' : 'none'}
              aria-label='open item'
              colorScheme='gray'
              icon={<SettingsIcon />}
            />
          </Link>
        </Flex>
      </Box>
    </Center>
  )
}

// TODO virtualize this
export const VaultList = () => {
  const { loginCredentials: LoginCredentials, TOTPSecrets } =
    useContext(DeviceStateContext)
  const [filterBy, setFilterBy] = useState('')
  const navigate = useNavigate()
  const debouncedSearchTerm = useDebounce(filterBy, 400)
  const { setSecuritySettings } = useContext(DeviceStateContext)

  const { data, loading } = useSyncSettingsQuery({
    fetchPolicy: 'cache-and-network'
  })
  const { colorMode, toggleColorMode } = useColorMode()

  // Here is bug wut theme change, this is not ideal
  useEffect(() => {
    if (data) {
      if (colorMode !== data.me.theme) {
        toggleColorMode()
      }

      setSecuritySettings({
        autofill: data.me?.autofill as boolean,
        language: data.me?.language as string,
        syncTOTP: data.currentDevice.syncTOTP as boolean,
        theme: data.me?.theme as string,
        vaultLockTimeoutSeconds: data.currentDevice
          .vaultLockTimeoutSeconds as number
      })
    }
  }, [data, loading])

  if (loading && !data) {
    return <Spinner />
  }

  const totpCond =
    data!.me.TOTPlimit <=
    device!.state!.decryptedSecrets.filter((x) => x.kind === 'TOTP').length
  const pswCond =
    data!.me.PasswordLimits <=
    device!.state!.decryptedSecrets.filter(
      (x) => x.kind === 'LOGIN_CREDENTIALS'
    ).length

  return (
    <VStack flexDirection='column' h={'90vh'}>
      <Center justifyContent={'space-evenly'} w={'100%'}>
        <Input
          variant={'filled'}
          color='grey.600'
          w={['300px', '350px', '400px', '500px']}
          placeholder={t`Search vault`}
          m='auto'
          onChange={(ev) => {
            setFilterBy(ev.target.value)
          }}
        />

        <Center px={3}>
          <Stat ml='auto' whiteSpace={'nowrap'}>
            {LoginCredentials.length + TOTPSecrets.length} {t`secrets`}
          </Stat>

          <RefreshSecretsButton />
        </Center>

        {totpCond || pswCond ? (
          <Tooltip
            shouldWrapChildren
            label='You have reached your limit'
            aria-label='A tooltip'
          >
            <IconButton
              disabled={true}
              aria-label='Add item'
              icon={<AddIcon />}
              rounded={'full'}
              onClick={async () => navigate('/addItem')}
            />
          </Tooltip>
        ) : (
          <IconButton
            aria-label='Add item'
            icon={<AddIcon />}
            rounded={'full'}
            onClick={async () => navigate('/addItem')}
          />
        )}
      </Center>
      <Center w={'95%'} h={'95%'}>
        <div style={{ flex: '1 1 auto', height: '100%', width: '100%' }}>
          <VirtualizedList filter={filterBy} />
        </div>
      </Center>
    </VStack>
  )
}
