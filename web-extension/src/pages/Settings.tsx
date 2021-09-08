import { Flex } from '@chakra-ui/layout'
import {
  Text,
  Button,
  Box,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import Security from '@src/components/setting-screens/Security'
import { SettingsForm } from '@src/components/setting-screens/SettingsForm'

export const Settings = () => {
  const [currSett, setCurrSett] = useState<'Security' | 'UI'>('Security')

  return (
    <Flex flexDirection="column" m={5}>
      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
          {currSett}
        </MenuButton>
        <MenuList>
          <MenuItem minH="48px" onClick={() => setCurrSett('Security')}>
            <Text fontSize="md">Security</Text>
          </MenuItem>
          <MenuItem minH="40px" onClick={() => setCurrSett('UI')}>
            <Text fontSize="md">UI</Text>
          </MenuItem>
        </MenuList>
      </Menu>

      <Box mt={2}>
        {currSett === 'Security' ? (
          <Security />
        ) : currSett === 'UI' ? (
          <SettingsForm />
        ) : null}
      </Box>
    </Flex>
  )
}
