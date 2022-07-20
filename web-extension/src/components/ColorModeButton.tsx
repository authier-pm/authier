import { IconButton, useColorMode } from '@chakra-ui/react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import React, { useContext } from 'react'
import { FiMoon } from 'react-icons/fi'
import { useUpdateSettingsMutation } from './vault/settings/VaultConfig.codegen'

export const ColorModeButton = () => {
  const { toggleColorMode } = useColorMode()
  const { setSecuritySettings, deviceState } = useContext(DeviceStateContext)
  const [updateSettings] = useUpdateSettingsMutation()

  return (
    <IconButton
      size="lg"
      variant="ghost"
      aria-label="change color mode"
      icon={<FiMoon />}
      onClick={async () => {
        if (deviceState) {
          const config = {
            autofill: deviceState?.autofill,
            language: deviceState.language,
            syncTOTP: deviceState.syncTOTP,
            theme: deviceState.theme === 'light' ? 'dark' : 'light',
            vaultLockTimeoutSeconds: parseInt(deviceState.lockTime)
          }

          await updateSettings({
            variables: {
              config
            }
          })

          setSecuritySettings(config)
        }
        toggleColorMode()
      }}
      mt="auto"
    />
  )
}
