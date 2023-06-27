import React, { useContext, useEffect, useState } from 'react'
import SInfo from 'react-native-sensitive-info'
import {
  Box,
  Center,
  Flex,
  HStack,
  Heading,
  Text,
  VStack,
  WarningIcon,
  useColorMode,
  useColorModeValue,
  useToast
} from 'native-base'
import { LoginContext } from './Login'

import {
  base64ToBuffer,
  cryptoKeyToString,
  dec,
  generateEncryptionKey
} from '@utils/generateEncryptionKey'
import { IBackgroundStateSerializable } from '@utils/deviceStore'
import useInterval from '@src/utils/useInterval'
import {
  useAddNewDeviceForUserMutation,
  useDeviceDecryptionChallengeMutation
} from '@shared/graphql/Login.codegen'
import { Platform } from 'react-native'
import { ToastAlert } from '@components/ToastAlert'
import { Loading } from '@components/Loading'
import { ToastType } from '../../ToastTypes'
import { Trans } from '@lingui/macro'
import { useDeviceStore } from '@utils/deviceStore'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'

export const useLogin = (props: { deviceName: string }) => {
  const toast = useToast()
  const id = 'active-toast'
  const { colorMode, toggleColorMode } = useColorMode()
  const { formState, setFormState } = useContext(LoginContext)
  const device = useDeviceStore((state) => state)
  const deviceState = useDeviceStateStore((state) => state)
  const [addNewDevice, { loading, error: newDeviceError }] =
    useAddNewDeviceForUserMutation()

  const [getDeviceDecryptionChallenge, { data: decryptionData, error }] =
    useDeviceDecryptionChallengeMutation({
      variables: {
        deviceInput: {
          id: device.id as string,
          name: props.deviceName,
          platform: Platform.OS
        },
        email: formState.email
      }
    })

  useEffect(() => {
    if (error || newDeviceError) {
      setFormState({ ...formState, password: '', submitted: false })
    }
  }, [error, newDeviceError])

  useInterval(() => {
    getDeviceDecryptionChallenge()
  }, 6000)

  const deviceDecryptionChallenge = decryptionData?.deviceDecryptionChallenge

  useEffect(() => {
    const { fireToken } = device

    if (
      deviceDecryptionChallenge?.__typename === 'DecryptionChallengeApproved' &&
      fireToken
    ) {
      ;(async () => {
        const addDeviceSecretEncrypted =
          deviceDecryptionChallenge?.addDeviceSecretEncrypted

        const userId = deviceDecryptionChallenge?.userId

        if (!addDeviceSecretEncrypted || !userId) {
          toast.show({
            id,
            render: () => <ToastAlert {...ToastType.UsernamePasswordError} />
          })
          setFormState({ ...formState, password: '', submitted: false })
          return
        }

        if (!deviceDecryptionChallenge?.id) {
          toast.show({
            id,
            render: () => <ToastAlert {...ToastType.DecryptionChallengeError} />
          })
          setFormState({ ...formState, password: '', submitted: false })

          return
        }

        const encryptionSalt = deviceDecryptionChallenge?.encryptionSalt

        const masterEncryptionKey = await generateEncryptionKey(
          formState.password,
          base64ToBuffer(encryptionSalt)
        )

        let currentAddDeviceSecret
        try {
          const encryptedDataBuff = base64ToBuffer(addDeviceSecretEncrypted)
          const iv = encryptedDataBuff.slice(16, 16 + 12)
          const data = encryptedDataBuff.slice(16 + 12)

          const decryptedContent = await self.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            masterEncryptionKey,
            data
          )
          currentAddDeviceSecret = dec.decode(decryptedContent)
        } catch (error) {
          console.error(error)
        }

        if (!currentAddDeviceSecret) {
          toast.show({
            id,
            render: () => <ToastAlert {...ToastType.UsernamePasswordError} />
          })
          setFormState({ ...formState, password: '', submitted: false })
          return
        }

        const newParams = await device.initLocalDeviceAuthSecret(
          masterEncryptionKey,
          base64ToBuffer(encryptionSalt)
        )

        const response = await addNewDevice({
          variables: {
            email: formState.email,
            deviceId: device.id as string,
            deviceInput: {
              id: device.id as string,
              name: props.deviceName,
              platform: Platform.OS
            },
            input: {
              addDeviceSecret: newParams.addDeviceSecret,
              addDeviceSecretEncrypted: newParams.addDeviceSecretEncrypted,
              firebaseToken: fireToken,
              devicePlatform: Platform.OS,
              encryptionSalt
            },
            currentAddDeviceSecret
          }
        })
        const addNewDeviceForUser =
          response.data?.deviceDecryptionChallenge?.__typename ===
          'DecryptionChallengeApproved'
            ? response.data?.deviceDecryptionChallenge.addNewDeviceForUser
            : null

        if (addNewDeviceForUser?.accessToken) {
          if (device.biometricsAvailable && deviceState.biometricsEnabled) {
            try {
              await SInfo.setItem('psw', formState.password, {
                sharedPreferencesName: 'authierShared',
                keychainService: 'authierKCH',
                touchID: true,
                showModal: true,
                kSecAccessControl: 'kSecAccessControlBiometryAny'
              })
              useDeviceStateStore.setState({ biometricsEnabled: true })
            } catch (error) {
              console.log(error)
              return
            }
          } else {
            console.log('biometrics not available')
            useDeviceStateStore.setState({ biometricsEnabled: false })
          }

          const EncryptedSecrets = addNewDeviceForUser.user.EncryptedSecrets

          const newDeviceState: IBackgroundStateSerializable = {
            masterEncryptionKey: await cryptoKeyToString(masterEncryptionKey),
            userId: userId,
            secrets: EncryptedSecrets,
            email: formState.email,
            encryptionSalt,
            deviceName: props.deviceName,
            authSecret: newParams.addDeviceSecret,
            authSecretEncrypted: newParams.addDeviceSecretEncrypted,
            vaultLockTimeoutSeconds:
              addNewDeviceForUser.user.device.vaultLockTimeoutSeconds,
            autofillTOTPEnabled:
              addNewDeviceForUser.user.device.autofillTOTPEnabled,
            autofillCredentialsEnabled:
              addNewDeviceForUser.user.device.autofillCredentialsEnabled,
            uiLanguage: addNewDeviceForUser.user.uiLanguage,
            syncTOTP: addNewDeviceForUser.user.device.syncTOTP,
            lockTimeEnd:
              Date.now() +
              addNewDeviceForUser.user.device.vaultLockTimeoutSeconds * 1000,
            //TODO: distinguish between "new" and "old" device
            theme: addNewDeviceForUser.user.defaultDeviceSettings.theme,
            notificationOnVaultUnlock:
              addNewDeviceForUser.user.notificationOnVaultUnlock,
            notificationOnWrongPasswordAttempts:
              addNewDeviceForUser.user.notificationOnWrongPasswordAttempts,
            accessToken: addNewDeviceForUser?.accessToken
          }

          if (colorMode !== newDeviceState.theme) {
            toggleColorMode()
          }

          device.save(newDeviceState)
        } else {
          toast.show({
            id,
            render: () => <ToastAlert {...ToastType.UsernamePasswordError} />
          })
        }
      })()
    } else if (!deviceDecryptionChallenge) {
      getDeviceDecryptionChallenge()
    }
  }, [deviceDecryptionChallenge])

  return { deviceDecryptionChallenge, loading }
}

export const LoginAwaitingApproval = () => {
  const { formState } = useContext(LoginContext)
  let device = useDeviceStore((state) => state)
  const [deviceName] = useState(device.name)
  const { deviceDecryptionChallenge } = useLogin({
    deviceName
  })

  const bgColor = useColorModeValue('white', 'rgb(18, 18, 18)')

  if (!deviceDecryptionChallenge || !device.fireToken) {
    return <Loading />
  }

  if (
    !deviceDecryptionChallenge ||
    (deviceDecryptionChallenge?.id &&
      deviceDecryptionChallenge.__typename === 'DecryptionChallengeForApproval')
  ) {
    return (
      <Flex flex={1} justifyContent={'center'}>
        <Box bgColor={bgColor} p={5} m={2} pt={8} pb={8} rounded="2xl">
          <VStack>
            <Heading size="sm" mb={2}>
              <Trans>Username: {formState.email}</Trans>
            </Heading>
            <HStack alignItems={'center'}>
              <WarningIcon mr={2} boxSize={30} />
              <Heading size="md" mr={4}>
                <Trans>Device:</Trans>
              </Heading>
              <Heading alignSelf={'center'} size="sm">
                {deviceName}
              </Heading>
            </HStack>
          </VStack>

          <Center mt={3}>
            <Flex flexDir="column">
              <Text fontSize="md" mb={2}>
                <Trans>
                  Approve this device in your device management in the vault on
                  your master device in order to proceed adding new device.
                </Trans>
              </Text>

              <Text fontSize="sm">
                <Trans>
                  After you approve it, your vault will open automatically in
                  this tab.
                </Trans>
              </Text>
            </Flex>
          </Center>
        </Box>
      </Flex>
    )
  }

  return <Loading />
}
