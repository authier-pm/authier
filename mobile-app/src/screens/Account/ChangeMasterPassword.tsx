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
  Button,
  useToast
} from 'native-base'

import { t, Trans } from '@lingui/macro'
import { DeviceContext } from '../../providers/DeviceProvider'
import { useChangeMasterPasswordMutation } from './ChangeMasterPassword.codegen'
import { useDeviceDecryptionChallengeMutation } from '@shared/graphql/Login.codegen'
import {
  base64ToBuffer,
  cryptoKeyToString,
  decryptDeviceSecretWithPassword,
  generateEncryptionKey
} from '@src/utils/generateEncryptionKey'
import { IBackgroundStateSerializable } from '@src/utils/Device'

export function ChangeMasterPassword() {
  let device = useContext(DeviceContext)
  const [changePassword] = useChangeMasterPasswordMutation()
  const [deviceDecryptionChallenge] = useDeviceDecryptionChallengeMutation()
  const toast = useToast()

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

              try {
                if (form.newPassword !== form.newPasswordConfirmation) {
                  toast.show({
                    title: t`Passwords do not match`,
                    variant: 'error'
                  })
                  return
                }

                const { addDeviceSecret } =
                  await decryptDeviceSecretWithPassword(
                    form.currentPassword,
                    device.state as IBackgroundStateSerializable
                  )

                if (addDeviceSecret !== device.state?.authSecret) {
                  toast.show({ title: t`Wrong password`, variant: 'error' })
                  return
                }

                const { state } = device

                if (
                  state &&
                  form.newPassword === form.newPasswordConfirmation
                ) {
                  const newEncryptionKey = await generateEncryptionKey(
                    form.newPassword,
                    base64ToBuffer(state.encryptionSalt)
                  )

                  const decryptionChallenge = await deviceDecryptionChallenge({
                    variables: {
                      deviceInput: {
                        id: device.id as string,
                        name: device.name,
                        platform: device.platform
                      },
                      email: device.state?.email
                    }
                  })

                  const secrets = state.secrets

                  const newDeviceSecretsPair =
                    await device.initLocalDeviceAuthSecret(
                      newEncryptionKey,
                      base64ToBuffer(state.encryptionSalt)
                    )

                  await changePassword({
                    variables: {
                      secrets: await device.serializeSecrets(
                        secrets,
                        form.newPassword
                      ),
                      addDeviceSecret: newDeviceSecretsPair.addDeviceSecret,
                      addDeviceSecretEncrypted:
                        newDeviceSecretsPair.addDeviceSecretEncrypted,
                      decryptionChallengeId: decryptionChallenge.data
                        ?.deviceDecryptionChallenge?.id as number
                    }
                  })

                  const deviceState: IBackgroundStateSerializable = {
                    ...state,
                    authSecret: newDeviceSecretsPair.addDeviceSecret,
                    authSecretEncrypted:
                      newDeviceSecretsPair.addDeviceSecretEncrypted,
                    masterEncryptionKey: await cryptoKeyToString(
                      newEncryptionKey
                    )
                  }
                  device.save(deviceState)

                  toast.show({
                    title: t`Password changed, all your other devices will be logged out and you will need to log in again`,
                    variant: 'success'
                  })
                } else {
                  toast.show({ title: t`Wrong password`, variant: 'error' })
                }
              } catch (err: any) {
                toast.show({
                  title: err.message,
                  colorScheme: 'red'
                })
              }
            }}
          >
            <Trans>Change password</Trans>
          </Button>
        </VStack>
      </Center>
    </View>
  )
}
