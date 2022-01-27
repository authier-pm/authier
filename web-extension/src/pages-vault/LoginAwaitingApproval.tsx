import { t, Trans } from '@lingui/macro'
import { device, DeviceState } from '@src/background/ExtensionDevice'
import { UserContext } from '@src/providers/UserProvider'
import React, { useContext, useEffect, useState } from 'react'
import { LoginFormValues } from './Login'
import {
  useAddNewDeviceForUserMutation,
  useDeviceDecryptionChallengeMutation
} from './Login.codegen'
import { toast } from 'react-toastify'
import { generateEncryptionKey } from '@src/util/generateEncryptionKey'
import cryptoJS from 'crypto-js'
import browser from 'webextension-polyfill'
import { getUserFromToken, setAccessToken } from '../util/accessTokenExtension'
import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import { Heading, Spinner, useInterval } from '@chakra-ui/react'

export const useLogin = (props: LoginFormValues & { deviceName: string }) => {
  const { setUserId } = useContext(UserContext)
  const [addNewDevice, { loading }] = useAddNewDeviceForUserMutation()

  const [getDeviceDecryptionChallenge, { data: decryptionData }] =
    useDeviceDecryptionChallengeMutation({
      variables: {
        deviceInput: {
          id: device.id,
          name: props.deviceName
        },
        email: props.email
      }
    })

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
      ;(async () => {
        const addDeviceSecretEncrypted =
          deviceDecryptionChallenge?.addDeviceSecretEncrypted

        const userId = deviceDecryptionChallenge?.userId

        if (!addDeviceSecretEncrypted || !userId) {
          toast.error(t`Login failed, check your username`)
          return
        }

        if (!deviceDecryptionChallenge?.id) {
          toast.error('failed to create decryption challenge')
          return
        }

        const encryptionSalt = deviceDecryptionChallenge?.encryptionSalt
        const masterEncryptionKey = generateEncryptionKey(
          props.password,
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
          toast.error('wrong password or email')
          return
        }

        const response = await addNewDevice({
          variables: {
            email: props.email,
            deviceInput: {
              id: device.id,
              name: props.deviceName
            },

            input: {
              addDeviceSecret: device.generateBackendSecret(),

              firebaseToken: fireToken
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
            email: props.email,
            encryptionSalt
          }

          setUserId(decodedToken.userId)

          device.save(deviceState)
          toast.success(t`Device approved successfully`)
        } else {
          toast.error(t`Login failed, check your username and password`)
        }
      })()
    }
  }, [deviceDecryptionChallenge?.__typename])

  return { deviceDecryptionChallenge, loading }
}

export const LoginAwaitingApproval: React.FC<LoginFormValues & {}> = (
  props
) => {
  const [deviceName, setDeviceName] = useState(device.generateDeviceName())

  const { deviceDecryptionChallenge, loading } = useLogin({
    ...props,
    deviceName
  })

  if (loading) {
    return <Spinner />
  }
  if (
    !deviceDecryptionChallenge ||
    (deviceDecryptionChallenge?.id && !deviceDecryptionChallenge?.approvedAt)
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
