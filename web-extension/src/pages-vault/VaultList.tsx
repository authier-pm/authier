import { IconButton } from '@chakra-ui/button'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { AddIcon } from '@chakra-ui/icons'
import {
  Center,
  Box,
  Input,
  Stat,
  Tooltip,
  Spinner,
  VStack,
  HStack
} from '@chakra-ui/react'
import { useContext, useEffect, useState } from 'react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { t } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { RefreshSecretsButton } from '@src/components/RefreshSecretsButton'
import { useSyncSettingsQuery } from '@shared/graphql/Settings.codegen'
import { VirtualizedList } from '@src/components/vault/VirtualizedList'
import { IoList } from 'react-icons/io5'
import { TableList } from '@src/components/vault/TableList'

export const VaultList = () => {
  const {
    loginCredentials: LoginCredentials,
    TOTPSecrets,
    tableView,
    setTableView
  } = useContext(DeviceStateContext)
  const [filterBy, setFilterBy] = useState('')
  const navigate = useNavigate()
  const { setSecuritySettings } = useContext(DeviceStateContext)
  const { data, loading, error } = useSyncSettingsQuery()

  const screenHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight
  const bg = useColorModeValue('white', 'gray.800')

  // Here is bug wut theme change, this is not ideal
  useEffect(() => {
    if (data) {
      setSecuritySettings({
        autofillCredentialsEnabled:
          data.currentDevice.autofillCredentialsEnabled,
        autofillTOTPEnabled: data.currentDevice.autofillTOTPEnabled,
        uiLanguage: data.me.uiLanguage,
        syncTOTP: data.currentDevice.syncTOTP,
        vaultLockTimeoutSeconds: data.currentDevice.vaultLockTimeoutSeconds,
        notificationOnWrongPasswordAttempts:
          data.me.notificationOnWrongPasswordAttempts,
        notificationOnVaultUnlock: data.me.notificationOnVaultUnlock
      })
    }
  }, [data, loading])

  if (loading && !data) {
    return <Spinner />
  }

  return (
    <Box overflow='hidden'>
      <Center justifyContent={'space-evenly'} w={'100%'} bg={bg} p={3}>
        <Input
          variant={'filled'}
          color='grey.300'
          w={['300px', '350px', '400px', '500px']}
          placeholder={t`Search vault by url, username, label or password`}
          m='auto'
          onChange={(ev) => {
            setFilterBy(ev.target.value)
          }}
        />

        <HStack spacing={4}>
          <Center>
            <Stat px={3} ml='auto' whiteSpace={'nowrap'}>
              {LoginCredentials.length + TOTPSecrets.length} {t`secrets`}
            </Stat>
            <RefreshSecretsButton />
          </Center>
          <IconButton
            size='md'
            ml='2'
            aria-label='menu'
            icon={<IoList />}
            onClick={() => setTableView(!tableView)}
          />

          {error ? (
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
        </HStack>
      </Center>
      <VStack flexDirection='column' h={screenHeight - 42}>
        <div style={{ flex: '1 1 auto', height: '100%', width: '100%' }}>
          {!tableView ? (
            <VirtualizedList filter={filterBy} />
          ) : (
            <TableList filter={filterBy} />
          )}
        </div>
      </VStack>
    </Box>
  )
}
