import { IconButton, useColorMode } from '@chakra-ui/react'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import React, { useContext } from 'react'
import { FiMoon } from 'react-icons/fi'

export const ColorModeButton = () => {
  const { toggleColorMode } = useColorMode()
  const { setSecuritySettings, deviceState } = useContext(DeviceStateContext)
  return (
    <IconButton
      size="lg"
      variant="ghost"
      aria-label="change color mode"
      icon={<FiMoon />}
      onClick={() => {
        if (deviceState) {
          setSecuritySettings({
            autofill: deviceState?.autofill,
            language: deviceState.language,
            syncTOTP: deviceState.syncTOTP,
            theme: deviceState.theme,
            vaultLockTimeoutSeconds: parseInt(deviceState.lockTime)
          })
        }
        toggleColorMode()
      }}
      mt="auto"
    />
  )
}
