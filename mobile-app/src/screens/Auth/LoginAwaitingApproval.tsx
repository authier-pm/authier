/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext, useEffect, useState } from 'react'

import { Heading, Text, useToast } from 'native-base'
import { LoginContext } from './Login'

import cryptoJS from 'crypto-js'

import { generateEncryptionKey } from '@utils/generateEncryptionKey'
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

        if (!currentAddDeviceSecret) {
          console.log('test2')
          toast.show({
            id,
            render: () => <ToastAlert {...ToastType.UsernamePasswordError} />
          })
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
              platform: Platform.OS
            },

            input: {
              addDeviceSecret: newAuthSecret,
              addDeviceSecretEncrypted: newAuthSecretEncrypted,
              firebaseToken: fireToken,
              devicePlatform: Platform.OS
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
            masterEncryptionKey,
            userId: userId,
            secrets: EncryptedSecrets,
            email: formState.email,
            encryptionSalt,
            deviceName: props.deviceName,
            authSecret: newAuthSecret,
            authSecretEncrypted: newAuthSecretEncrypted,
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
