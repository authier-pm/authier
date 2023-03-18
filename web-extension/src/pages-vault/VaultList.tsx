import { IconButton } from '@chakra-ui/button'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { UnlockIcon, SettingsIcon, AddIcon } from '@chakra-ui/icons'
import {
  Center,
  Box,
  Flex,
  Text,
  Input,
  Stat,
  useColorMode,
  Tooltip,
  Spinner,
  VStack
} from '@chakra-ui/react'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { useContext, useEffect, useState } from 'react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { t } from '@lingui/macro'
import { Link, useNavigate } from 'react-router-dom'
import { SecretItemIcon } from '@src/components/SecretItemIcon'
import { RefreshSecretsButton } from '@src/components/RefreshSecretsButton'
import { getDecryptedSecretProp } from '@src/background/ExtensionDevice'
import { useSyncSettingsQuery } from '@shared/graphql/Settings.codegen'
import { VirtualizedList } from '@src/components/vault/VirtualizedList'
import browser from 'webextension-polyfill'
import { DeleteSecretButton } from './DeleteSecretButton'

export function VaultListItem({
  secret
}: {
  secret: ILoginSecret | ITOTPSecret
}) {
  const [isVisible, setIsVisible] = useState(false)

  const { deviceState } = useContext(DeviceStateContext)
  if (!deviceState) {
    return null
  }
  const secretUrl = getDecryptedSecretProp(secret, 'url')
  return (
    <Center py={3} m={['auto', '3']}>
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
            <SecretItemIcon
              url={secretUrl}
              iconUrl={getDecryptedSecretProp(secret, 'iconUrl')}
            />
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
            sx={{
              svg: {
                position: 'absolute' // needed for DeleteSecretButton
              }
            }}
          >
            <DeleteSecretButton secret={secret} />

            {secretUrl ? (
              <IconButton
                aria-label="open item"
                colorScheme="blackAlpha"
                icon={<UnlockIcon />}
                onClick={() => browser.tabs.create({ url: secretUrl })}
              />
            ) : null}
          </Flex>
        </Box>
        <Flex
          flexDirection="row"
          align="center"
          justifyContent="space-between"
          p={4}
        >
          <Text fontWeight={'bold'} fontSize={'lg'} noOfLines={1}>
            {getDecryptedSecretProp(secret, 'label')}
          </Text>

          <Link
            to={{
              pathname: `secret/${secret.id}`
            }}
            state={{ data: secret }}
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

export const VaultList = () => {
  const { loginCredentials: LoginCredentials, TOTPSecrets } =
    useContext(DeviceStateContext)
  const [filterBy, setFilterBy] = useState('')
  const navigate = useNavigate()
  const { setSecuritySettings } = useContext(DeviceStateContext)

  const { data, loading, error } = useSyncSettingsQuery()

  // Here is bug wut theme change, this is not ideal
  useEffect(() => {
    if (data) {
      setSecuritySettings({
        autofillCredentialsEnabled: data.me?.autofillCredentialsEnabled,
        autofillTOTPEnabled: data.me?.autofillTOTPEnabled,
        uiLanguage: data.me?.uiLanguage,
        syncTOTP: data.currentDevice.syncTOTP,
        vaultLockTimeoutSeconds: data.currentDevice
          .vaultLockTimeoutSeconds as number
      })
    }
  }, [data, loading])

  if (loading && !data) {
    return <Spinner />
  }
  const screenHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight

  return (
    <>
      <Center
        justifyContent={'space-evenly'}
        w={'100%'}
        bgColor={'teal.900'}
        p={3}
      >
        <Input
          variant={'filled'}
          color="grey.500"
          w={['300px', '350px', '400px', '500px']}
          placeholder={t`Search vault by url, username, label or password`}
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

        {error ? (
          <Tooltip
            shouldWrapChildren
            label="You have reached your limit"
            aria-label="A tooltip"
          >
            <IconButton
              disabled={true}
              aria-label="Add item"
              icon={<AddIcon />}
              rounded={'full'}
              onClick={async () => navigate('/addItem')}
            />
          </Tooltip>
        ) : (
          <IconButton
            aria-label="Add item"
            icon={<AddIcon />}
            rounded={'full'}
            onClick={async () => navigate('/addItem')}
          />
        )}
      </Center>

      <VStack flexDirection="column" h={screenHeight - 42}>
        <Center w={'95%'} h={'100%'}>
          <div style={{ flex: '1 1 auto', height: '100%', width: '100%' }}>
            <VirtualizedList filter={filterBy} />
          </div>
        </Center>
      </VStack>
    </>
  )
}
