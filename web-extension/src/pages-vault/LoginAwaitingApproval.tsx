import { t, Trans } from '@lingui/macro'
import { device } from '@src/background/ExtensionDevice'
import { UserContext } from '@src/providers/UserProvider'
import React, { useContext, useEffect, useState } from 'react'
import { LoginContext } from './Login'
import {
  useAddNewDeviceForUserMutation,
  useDeviceDecryptionChallengeMutation
} from '@shared/graphql/Login.codegen'
import browser from 'webextension-polyfill'
import { getUserFromToken, setAccessToken } from '../util/accessTokenExtension'
import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import {
  Card,
  Center,
  Flex,
  Heading,
  Spinner,
  useInterval
} from '@chakra-ui/react'
import { formatRelative } from 'date-fns'
import { WarningIcon } from '@chakra-ui/icons'
import debug from 'debug'
import {
  ab2str,
  base64ToStr,
  cryptoKeyToString,
  str2ab,
  strToBase64,
  testGenerateEncryptionKey
} from '@shared/generateEncryptionKey'
import { toast } from '@src/Providers'

export const LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL = 6000
export const log = debug('au:LoginAwaitingApproval')

export const useLogin = (props: { deviceName: string }) => {
  const { formState, setFormState } = useContext(LoginContext)

  const { setUserId } = useContext(UserContext)
  const [addNewDevice, { loading, error }] = useAddNewDeviceForUserMutation()

  const [
    getDeviceDecryptionChallenge,
    { data: decryptionData, error: decrChallError }
  ] = useDeviceDecryptionChallengeMutation({
    variables: {
      deviceInput: {
        id: device.id as string,
        name: props.deviceName,
        platform: device.platform
      },
      email: formState.email
    }
  })

  useEffect(() => {
    if (error || decrChallError) {
      setFormState(null)
    }
  }, [error, decrChallError])

  useInterval(() => {
    getDeviceDecryptionChallenge()
  }, LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL)
  const deviceDecryptionChallenge = decryptionData?.deviceDecryptionChallenge

  useEffect(() => {
    console.log('~ decryptionData', decryptionData)
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
          toast({
            title: t`Login failed, check your email or password`,
            status: 'error',
            isClosable: true
          })
          return
        }

        if (!deviceDecryptionChallenge?.id) {
          toast({
            title: 'Failed to create decryption challenge',
            status: 'error',
            isClosable: true
          })
          return
        }

        const encryptionSalt = deviceDecryptionChallenge?.encryptionSalt

        const masterEncryptionKey = await testGenerateEncryptionKey(
          formState.password,
          encryptionSalt
        )

        console.log('authSEcret', base64ToStr(addDeviceSecretEncrypted))

        let currentAddDeviceSecret
        try {
          currentAddDeviceSecret = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: str2ab(userId) },
            masterEncryptionKey,
            str2ab(base64ToStr(addDeviceSecretEncrypted))
          )
        } catch (error) {
          console.error(error)
        }

        log('~ currentAddDeviceSecret', currentAddDeviceSecret)

        if (!currentAddDeviceSecret) {
          toast({
            title: t`Login failed, check your email or password`,
            status: 'error',
            isClosable: true
          })
          setFormState(null)
          return
        }

        const newAuthSecret = device.generateBackendSecret()
        const newAuthSecretEncrypted = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: str2ab(userId) },
          masterEncryptionKey,
          str2ab(newAuthSecret)
        )

        const response = await addNewDevice({
          variables: {
            email: formState.email,
            deviceInput: {
              id: device.id as string,
              name: props.deviceName,
              platform: device.platform
            },

            input: {
              addDeviceSecret: strToBase64(newAuthSecret),
              addDeviceSecretEncrypted: strToBase64(
                ab2str(newAuthSecretEncrypted)
              ),
              firebaseToken: fireToken,
              devicePlatform: device.platform
            },
            currentAddDeviceSecret: strToBase64(ab2str(currentAddDeviceSecret))
          }
        })

        await browser.storage.local.set({
          addDeviceSecretEncrypted,
          currentAddDeviceSecret
        })

        const addNewDeviceForUser =
          response.data?.deviceDecryptionChallenge?.__typename ===
          'DecryptionChallengeApproved'
            ? response.data?.deviceDecryptionChallenge.addNewDeviceForUser
            : null

        if (addNewDeviceForUser?.accessToken) {
          setAccessToken(addNewDeviceForUser?.accessToken)

          const decodedToken = await getUserFromToken()

          const EncryptedSecrets = addNewDeviceForUser.user.EncryptedSecrets

          const deviceState: IBackgroundStateSerializable = {
            masterEncryptionKey: await cryptoKeyToString(masterEncryptionKey),
            userId: userId,
            secrets: EncryptedSecrets,
            email: formState.email,
            encryptionSalt,
            deviceName: props.deviceName,
            authSecret: newAuthSecret,
            authSecretEncrypted: ab2str(newAuthSecretEncrypted),
            lockTime: 28800,
            autofill: true,
            language: 'en',
            syncTOTP: false,
            theme: 'dark'
          }

          setUserId(decodedToken.userId)
          device.save(deviceState)

          toast({
            title: t`Device approved at ${formatRelative(
              new Date(),
              new Date(deviceDecryptionChallenge.approvedAt as string)
            )}`,
            status: 'success',
            isClosable: true
          })
        } else {
          toast({
            title: t`Login failed, check your username or password`,
            status: 'error',
            isClosable: true
          })
        }
      })()
    } else if (!deviceDecryptionChallenge) {
      getDeviceDecryptionChallenge()
    }
  }, [deviceDecryptionChallenge])

  return { deviceDecryptionChallenge, loading }
}

export const LoginAwaitingApproval: React.FC = () => {
  const [deviceName] = useState(device.generateDeviceName())
  const { deviceDecryptionChallenge } = useLogin({
    deviceName
  })

  if (!deviceDecryptionChallenge) {
    return <Spinner />
  }
  if (
    !deviceDecryptionChallenge ||
    (deviceDecryptionChallenge?.id &&
      deviceDecryptionChallenge.__typename === 'DecryptionChallengeForApproval')
  ) {
    return (
      <Card p={8} borderWidth={1} borderRadius={6} boxShadow="lg" minW="600px">
        <Flex align={'center'}>
          <WarningIcon mr={2} boxSize={30} />
          <Heading size="md" mr={4}>
            <Trans>Device: </Trans>
          </Heading>
          <Heading size="sm">{deviceName}</Heading>
        </Flex>
        <Flex>
          <Center mt={3}>
            <Trans>
              Approve this device in your device management in the vault on your
              master device in order to finish adding new device. Afterwards
              your vault will open automatically in this tab.
            </Trans>
          </Center>
        </Flex>
      </Card>
    )
  } else {
    return null
  }
}
