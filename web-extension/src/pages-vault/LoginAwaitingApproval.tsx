import { t, Trans } from '@lingui/macro'
import { device } from '@src/background/ExtensionDevice'
import { UserContext } from '@src/providers/UserProvider'
import React, { useContext, useEffect, useState } from 'react'
import { LoginContext } from './Login'
import {
  useAddNewDeviceForUserMutation,
  useDeviceDecryptionChallengeMutation
} from '@shared/graphql/Login.codegen'
import { toast } from 'react-toastify'
import { generateEncryptionKey } from '@src/util/generateEncryptionKey'
import cryptoJS from 'crypto-js'
import browser from 'webextension-polyfill'
import { getUserFromToken, setAccessToken } from '../util/accessTokenExtension'
import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import { Heading, Spinner, useInterval } from '@chakra-ui/react'
import { formatRelative } from 'date-fns'

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

  //FIX: Should be handled by the error link
  useEffect(() => {
    if (error || decrChallError) {
      toast.error('failed to create decryption challenge')
      setFormState(null)
    }
  }, [error, decrChallError])

  useInterval(() => {
    getDeviceDecryptionChallenge()
  }, 6000)
  const deviceDecryptionChallenge = decryptionData?.deviceDecryptionChallenge

  useEffect(() => {
    console.log('~ decryptionData', decryptionData)
    const { fireToken } = device

    if (
      deviceDecryptionChallenge?.__typename === 'DecryptionChallengeApproved' &&
      fireToken
    ) {
      ; (async () => {
        const addDeviceSecretEncrypted =
          deviceDecryptionChallenge?.addDeviceSecretEncrypted

        const userId = deviceDecryptionChallenge?.userId

        if (!addDeviceSecretEncrypted || !userId) {
          toast.error(t`Login failed, check your email or password`)
          return
        }

        if (!deviceDecryptionChallenge?.id) {
          toast.error('Failed to create decryption challenge')
          return
        }

        const encryptionSalt = deviceDecryptionChallenge?.encryptionSalt
        const masterEncryptionKey = generateEncryptionKey(
          formState.password,
          encryptionSalt
        )

        const currentAddDeviceSecret = cryptoJS.AES.decrypt(
          addDeviceSecretEncrypted,
          masterEncryptionKey,
          {
            iv: cryptoJS.enc.Utf8.parse(userId)
          }
        ).toString(cryptoJS.enc.Utf8)
        console.log('~ currentAddDeviceSecret', currentAddDeviceSecret)

        if (!currentAddDeviceSecret) {
          toast.error(t`Login failed, check your email or password`)
          setFormState(null)
          return
        }

        const newAuthSecret = device.generateBackendSecret()
        const newAuthSecretEncrypted = cryptoJS.AES.encrypt(
          newAuthSecret,
          masterEncryptionKey,
          {
            iv: cryptoJS.enc.Utf8.parse(userId)
          }
        ).toString()

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
              devicePlatform: device.platform
            },
            currentAddDeviceSecret
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
            masterEncryptionKey,
            userId: userId,
            secrets: EncryptedSecrets,
            email: formState.email,
            encryptionSalt,
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

          toast.success(
            t`Device approved at ${formatRelative(
              new Date(),
              new Date(deviceDecryptionChallenge.approvedAt as string)
            )}`
          )
        } else {
          toast.error(t`Login failed, check your username and password`)
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
      <>
        <Trans>Device: </Trans>
        <Heading size="sm">{deviceName}</Heading>
        <br />
        <Trans>
          Approve this device in your device management in the vault on another
          device in order to finish login.
        </Trans>
      </>
    )
  } else {
    return null
  }
}
