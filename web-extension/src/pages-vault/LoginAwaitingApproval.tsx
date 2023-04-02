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
  base64ToBuffer,
  cryptoKeyToString,
  dec,
  generateEncryptionKey
} from '@util/generateEncryptionKey'
import { toast } from '@src/ExtensionProviders'
import { Txt } from '@src/components/util/Txt'

export const LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL = 6000
export const log = debug('au:LoginAwaitingApproval')

export const useLogin = (props: { deviceName: string }) => {
  const { formStateContext, setFormStateContext } = useContext(LoginContext)

  const { setUserId } = useContext(UserContext)
  const [addNewDevice, { loading, error }] = useAddNewDeviceForUserMutation()

  const [
    getDeviceDecryptionChallenge,
    { data: decryptionData, error: decryptionChallengeError }
  ] = useDeviceDecryptionChallengeMutation({
    variables: {
      deviceInput: {
        id: device.id as string,
        name: props.deviceName,
        platform: device.platform
      },
      email: formStateContext.email
    }
  })

  useEffect(() => {
    if (error || decryptionChallengeError) {
      setFormStateContext({
        ...formStateContext,
        isSubmitted: false
      })
    }
  }, [error, decryptionChallengeError])

  useInterval(() => {
    getDeviceDecryptionChallenge()
  }, LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL)
  const deviceDecryptionChallenge = decryptionData?.deviceDecryptionChallenge

  useEffect(() => {
    const { fireToken } = device

    console.log('~ decryptionData', decryptionData, fireToken)
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
            title: t`Login failed, try removing and adding the extension again`,
            status: 'error',
            isClosable: true
          })
          return
        }

        if (!deviceDecryptionChallenge?.id) {
          toast({
            title: t`Failed to create decryption challenge`,
            status: 'error',
            isClosable: true
          })
          return
        }

        const encryptionSalt = deviceDecryptionChallenge?.encryptionSalt

        const masterEncryptionKey = await generateEncryptionKey(
          formStateContext.password,
          base64ToBuffer(encryptionSalt)
        )

        let currentAddDeviceSecret: string | null = null
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
          toast({
            title: t`Login failed, check your email or password`,
            status: 'error',
            isClosable: true
          })
          setFormStateContext({
            ...formStateContext,
            isSubmitted: false
          })
          return
        }

        const newDeviceSecretsPair = await device.initLocalDeviceAuthSecret(
          masterEncryptionKey,
          base64ToBuffer(encryptionSalt)
        )

        const response = await addNewDevice({
          variables: {
            email: formStateContext.email,
            deviceInput: {
              id: device.id as string,
              name: props.deviceName,
              platform: device.platform
            },
            input: {
              addDeviceSecret: newDeviceSecretsPair.addDeviceSecret,
              addDeviceSecretEncrypted:
                newDeviceSecretsPair.addDeviceSecretEncrypted,
              firebaseToken: fireToken,
              devicePlatform: device.platform,
              //WARNING: Has to be the same all the time
              encryptionSalt
            },
            currentAddDeviceSecret: currentAddDeviceSecret
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
            email: formStateContext.email,
            encryptionSalt,
            deviceName: props.deviceName,
            authSecret: newDeviceSecretsPair.addDeviceSecret,
            authSecretEncrypted: newDeviceSecretsPair.addDeviceSecretEncrypted,
            lockTime: 28800,
            autofillTOTPEnabled: true,
            autofillCredentialsEnabled: true,
            uiLanguage: 'en',
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

  return { deviceDecryptionChallenge, loading, formState: formStateContext }
}

export const LoginAwaitingApproval: React.FC = () => {
  const [deviceName] = useState(device.generateDeviceName())
  const { deviceDecryptionChallenge, formState } = useLogin({
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
        <Heading size="sm" mb={2}>
          <Trans>Username: {formState.email}</Trans>
        </Heading>
        <Flex align={'center'}>
          <WarningIcon mr={2} boxSize={30} />
          <Heading size="md" mr={4}>
            <Trans>Device: </Trans>
          </Heading>
          <Heading size="sm">{deviceName}</Heading>
        </Flex>
        <Center mt={3}>
          <Flex flexDir="column">
            <Txt fontSize="md" mb={2}>
              <Trans>
                Approve this device in your device management in the vault on
                your master device in order to proceed adding new device.
              </Trans>
            </Txt>

            <Txt fontSize="sm">
              <Trans>
                After you approve it, the vault password will be checked and
                your vault will open automatically in this tab.
              </Trans>
            </Txt>
          </Flex>
        </Center>
      </Card>
    )
  } else {
    return null
  }
}
