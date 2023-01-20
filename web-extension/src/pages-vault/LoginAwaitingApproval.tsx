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
  base64_to_buf,
  buff_to_base64,
  cryptoKeyToString,
  dec,
  enc,
  encryptedBuf_to_base64,
  generateEncryptionKey
} from '@util/generateEncryptionKey'
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

        const masterEncryptionKey = await generateEncryptionKey(
          formState.password,
          base64_to_buf(encryptionSalt)
        )

        let currentAddDeviceSecret
        try {
          const encryptedDataBuff = base64_to_buf(addDeviceSecretEncrypted)
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
        const iv = window.crypto.getRandomValues(new Uint8Array(12))
        const salt = window.crypto.getRandomValues(new Uint8Array(16))

        const newAuthSecretEncryptedAb = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          masterEncryptionKey,
          enc.encode(newAuthSecret)
        )

        const newAuthSecretEncrypted = encryptedBuf_to_base64(
          newAuthSecretEncryptedAb,
          iv,
          salt
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
              addDeviceSecret: newAuthSecret,
              addDeviceSecretEncrypted: newAuthSecretEncrypted,
              firebaseToken: fireToken,
              devicePlatform: device.platform,
              encryptionSalt: buff_to_base64(salt)
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
            email: formState.email,
            encryptionSalt: buff_to_base64(salt),
            deviceName: props.deviceName,
            authSecret: newAuthSecret,
            authSecretEncrypted: newAuthSecretEncrypted,
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
