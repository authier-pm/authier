/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext, useEffect, useState } from 'react'

import { Heading, Text, useToast } from 'native-base'
import { LoginContext } from './Login'

import {
  base64_to_buf,
  buff_to_base64,
  cryptoKeyToString,
  dec,
  enc,
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
import { DeviceState } from '@src/utils/DeviceState'
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
  const [addNewDevice, { loading }] = useAddNewDeviceForUserMutation()

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
    if (error) {
      if (!toast.isActive(id)) {
        toast.show({
          id,
          render: () => (
            <ToastAlert
              {...ToastServerErrorDetails}
              description={error.message}
            />
          )
        })
      }

      setFormState(null)
    }
  }, [error])

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
          console.log('test1')
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

        if (!currentAddDeviceSecret) {
          toast.show({
            id,
            render: () => <ToastAlert {...ToastType.UsernamePasswordError} />
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

        const encryptedContentArr = new Uint8Array(newAuthSecretEncryptedAb)
        let buff = new Uint8Array(
          salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
        )
        buff.set(salt, 0)
        buff.set(iv, salt.byteLength)
        buff.set(encryptedContentArr, salt.byteLength + iv.byteLength)
        const newAuthSecretEncryptedBase64Buff = buff_to_base64(buff)

        const response = await addNewDevice({
          variables: {
            email: formState.email,
            deviceInput: {
              id: device.id as string,
              name: props.deviceName,
              platform: Platform.OS
            },

            input: {
              addDeviceSecret: newAuthSecret,
              addDeviceSecretEncrypted: newAuthSecretEncryptedBase64Buff,
              firebaseToken: fireToken,
              devicePlatform: Platform.OS,
              encryptionSalt: buff_to_base64(salt)
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
            encryptionSalt: buff_to_base64(salt),
            deviceName: props.deviceName,
            authSecret: newAuthSecret,
            authSecretEncrypted: newAuthSecretEncryptedBase64Buff,
            lockTime: 28800,
            autofill: false,
            language: 'en',
            lockTimeEnd: Date.now() + 28800000,
            syncTOTP: false,
            theme: 'dark'
          }
          device.state = new DeviceState(deviceState)
          device.save()
        } else {
          console.log('test3')
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
  let device = useContext(DeviceContext)
  const [deviceName] = useState(device.name)
  const { deviceDecryptionChallenge } = useLogin({
    deviceName
  })

  if (!deviceDecryptionChallenge) {
    return <Loading />
  }

  if (
    !deviceDecryptionChallenge ||
    (deviceDecryptionChallenge?.id &&
      deviceDecryptionChallenge.__typename === 'DecryptionChallengeForApproval')
  ) {
    return (
      <>
        <Text>Device: </Text>
        <Heading size="sm">{deviceName}</Heading>

        <Text>
          <Trans>
            Approve this device in your device management in the vault on your
            master device in order to finish adding new device. Afterwards your
            vault will open automatically.
          </Trans>
        </Text>
      </>
    )
  }

  return <Loading />
}
