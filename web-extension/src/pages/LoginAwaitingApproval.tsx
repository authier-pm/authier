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

export const LoginAwaitingApproval: React.FC<LoginFormValues & {}> = (
  props
) => {
  const { setUserId } = useContext(UserContext)
  const [addNewDevice] = useAddNewDeviceForUserMutation()

  const [deviceDecryptionChallenge, { data: decryptionData }] =
    useDeviceDecryptionChallengeMutation({
      variables: {
        email: props.email,
        deviceId: device.id
      }
    })

  useInterval(() => {
    deviceDecryptionChallenge()
  }, 6000)

  useEffect(() => {
    ;(async () => {
      if (
        decryptionData?.deviceDecryptionChallenge?.__typename ===
          'DecryptionChallengeMutation' &&
        device.fireToken
      ) {
        const addDeviceSecretEncrypted =
          decryptionData?.deviceDecryptionChallenge?.addDeviceSecretEncrypted

        const userId = decryptionData?.deviceDecryptionChallenge?.userId

        if (!addDeviceSecretEncrypted || !userId) {
          toast.error(t`Login failed, check your username`)
          return
        }

        if (!decryptionData?.deviceDecryptionChallenge?.id) {
          toast.error('failed to create decryption challenge')
          return
        }

        const encryptionSalt =
          decryptionData?.deviceDecryptionChallenge?.encryptionSalt
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

        if (!currentAddDeviceSecret) {
          toast.error('wrong password or email')
          return
        }

        const response = await addNewDevice({
          variables: {
            input: {
              deviceId: await device.getDeviceId(),
              ...device.getAddDeviceSecretAuthParams(
                masterEncryptionKey,
                userId
              ),
              email: props.email,
              deviceName: deviceName,
              firebaseToken: device.fireToken,
              decryptionChallengeId: decryptionData.deviceDecryptionChallenge.id
            },
            currentAddDeviceSecret
          }
        })

        await browser.storage.local.set({
          addDeviceSecretEncrypted,
          currentAddDeviceSecret
        })

        const addNewDeviceForUser = response.data?.addNewDeviceForUser
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
      }
    })()
  }, [decryptionData?.deviceDecryptionChallenge?.__typename])

  const deviceName = device.generateDeviceName()

  if (
    decryptionData?.deviceDecryptionChallenge?.id &&
    !decryptionData?.deviceDecryptionChallenge?.approvedAt
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
