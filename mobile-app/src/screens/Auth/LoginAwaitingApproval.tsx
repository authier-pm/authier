/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext, useEffect, useState } from 'react'

import {
  Box,
  Center,
  Flex,
  HStack,
  Heading,
  Text,
  VStack,
  WarningIcon,
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
import { DeviceContext } from '../../providers/DeviceProvider'
import { IBackgroundStateSerializable } from '@utils/Device'
import { saveAccessToken } from '@utils/tokenFromAsyncStorage'
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

const ToastServerErrorDetails = {
  title: 'Something went wrong',
  variant: 'subtle',
  description: 'Please create a support ticket from the support page',
  status: 'warning'
}

export const useLogin = (props: { deviceName: string }) => {
  const toast = useToast()
  const id = 'active-toast'
  const { formState, setFormState } = useContext(LoginContext)
  let device = useContext(DeviceContext)
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
      if (!toast.isActive(id)) {
        toast.show({
          id,
          render: () => (
            <ToastAlert
              {...ToastServerErrorDetails}
              description={error ? error.message : newDeviceError?.message}
            />
          )
        })
      }

      setFormState(null)
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
          setFormState(null)
          return
        }

        if (!deviceDecryptionChallenge?.id) {
          toast.show({
            id,
            render: () => <ToastAlert {...ToastType.DecryptionChallengeError} />
          })
          setFormState(null)

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

          const decryptedContent = await window.crypto.subtle.decrypt(
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
          setFormState(null)
          return
        }

        const newParams = await device.initLocalDeviceAuthSecret(
          masterEncryptionKey,
          base64ToBuffer(encryptionSalt)
        )

        const response = await addNewDevice({
          variables: {
            email: formState.email,
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
          saveAccessToken(addNewDeviceForUser?.accessToken)

          const EncryptedSecrets = addNewDeviceForUser.user.EncryptedSecrets

          const deviceState: IBackgroundStateSerializable = {
            masterEncryptionKey: await cryptoKeyToString(masterEncryptionKey),
            userId: userId,
            secrets: EncryptedSecrets,
            email: formState.email,
            encryptionSalt,
            deviceName: props.deviceName,
            authSecret: newParams.addDeviceSecret,
            authSecretEncrypted: newParams.addDeviceSecretEncrypted,
            lockTime: 28800,
            autofillCredentialsEnabled: false,
            autofillTOTPEnabled: false,
            uiLanguage: addNewDeviceForUser.user.uiLanguage,
            lockTimeEnd: Date.now() + 28800000,
            //TODO: Take this from DB
            syncTOTP: false,
            theme: addNewDeviceForUser.user.defaultDeviceTheme
          }

          device.save(deviceState)
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
  let device = useContext(DeviceContext)
  const [deviceName] = useState(device.name)
  const { deviceDecryptionChallenge } = useLogin({
    deviceName
  })

  const bgColor = useColorModeValue('white', 'rgb(18, 18, 18)')

  if (!deviceDecryptionChallenge) {
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
