import { t, Trans } from '@lingui/macro'
import { device, DeviceState } from '@src/background/ExtensionDevice'
import { UserContext } from '@src/providers/UserProvider'
import React, { useContext, useEffect } from 'react'
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
import { Heading, useInterval } from '@chakra-ui/react'

export const useLogin = (props: LoginFormValues) => {
  const { setUserId } = useContext(UserContext)
  const [addNewDevice] = useAddNewDeviceForUserMutation()

  const [getDeviceDecryptionChallenge, { data: decryptionData }] =
    useDeviceDecryptionChallengeMutation({
      variables: {
        deviceId: device.id,
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
            deviceId: await device.getDeviceId(),

            input: {
              addDeviceSecret: device.generateBackendSecret(),
              deviceName: device.generateDeviceName(),
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

          device.state = new DeviceState(deviceState)
          device.state.save()
          device.rerenderViews()
        } else {
          toast.error(t`Login failed, check your username and password`)
        }
      })()
    }
  }, [deviceDecryptionChallenge?.__typename])

  return deviceDecryptionChallenge
}

export const LoginAwaitingApproval: React.FC<LoginFormValues & {}> = (
  props
) => {
  const deviceDecryptionChallenge = useLogin(props)

  const deviceName = device.generateDeviceName()

  if (
    !deviceDecryptionChallenge ||
    (deviceDecryptionChallenge?.id && !deviceDecryptionChallenge?.approvedAt)
  ) {
    return (
      <>
        <Heading size="sm">{deviceName}</Heading>
        <Trans>
          Approve this device in your device management in the vault on another
          device.
        </Trans>
      </>
    )
  } else {
    return null
  }
}
