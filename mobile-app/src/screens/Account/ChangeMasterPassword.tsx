import React, { useContext } from 'react'

import {
  Box,
  Center,
  Text,
  useColorModeValue,
  View,
  VStack,
  Input,
  FormControl,
  Stack,
  WarningOutlineIcon,
  Button
} from 'native-base'

import { Trans } from '@lingui/macro'
import { DeviceContext } from '../../providers/DeviceProvider'

export function ChangeMasterPassword() {
  let device = useContext(DeviceContext)

  const itemBg = useColorModeValue('white', 'rgb(28, 28, 28)')
  const [form, setForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirmation: ''
  })

  return (
    <View>
      <Center mt={5}>
        <VStack width="90%" space={4}>
          <VStack space={2}>
            <FormControl isRequired>
              <Stack mx="4">
                <FormControl.Label>
                  <Trans>Current Password</Trans>
                </FormControl.Label>
                <Input
                  type="password"
                  value={form.currentPassword}
                  onChangeText={(value) => {
                    setForm({ ...form, currentPassword: value })
                  }}
                  placeholder="password"
                />
                <FormControl.HelperText>
                  Must be at least 6 characters.
                </FormControl.HelperText>
                <FormControl.ErrorMessage
                  leftIcon={<WarningOutlineIcon size="xs" />}
                >
                  At least 6 characters are required.
                </FormControl.ErrorMessage>
              </Stack>
            </FormControl>
          </VStack>

          <VStack space={2}>
            <Text>
              <Trans>New password</Trans>
            </Text>

            <Box backgroundColor={itemBg} p={3} rounded="xl">
              <Input
                type="password"
                value={form.newPassword}
                onChangeText={(value) => {
                  setForm({ ...form, newPassword: value })
                }}
              ></Input>
            </Box>
          </VStack>

          <VStack space={2}>
            <Text>
              <Trans>New password confirmation</Trans>
            </Text>

            <Box backgroundColor={itemBg} p={3} rounded="xl">
              <Input
                type="password"
                value={form.newPasswordConfirmation}
                onChangeText={(value) => {
                  setForm({ ...form, newPasswordConfirmation: value })
                }}
              ></Input>
            </Box>
          </VStack>
          <Button
            onPress={async () => {
              console.log(form)
              // TODO: implement change password
            }}
          >
            <Trans>Change password</Trans>
          </Button>
        </VStack>
      </Center>
    </View>
  )
}
