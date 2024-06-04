import React, { useEffect, useState } from 'react'
import { Formik, FormikHelpers } from 'formik'
import {
  Button,
  Center,
  FormControl,
  Heading,
  Icon,
  Input,
  useColorModeValue,
  useToast,
  View,
  VStack
} from 'native-base'
import {
  base64ToBuffer,
  cryptoKeyToString,
  dec,
  generateEncryptionKey
} from '@utils/generateEncryptionKey'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { Loading } from '@src/components/Loading'
import { ToastAlert } from '@src/components/ToastAlert'
import { ToastType } from '@src/ToastTypes'
import RNBootSplash from 'react-native-bootsplash'
import { useDeviceStore } from '@src/utils/deviceStore'
import SInfo from 'react-native-sensitive-info'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'

interface Values {
  password: string
}

export function VaultUnlockVerification() {
  const toast = useToast()
  const id = 'active-toast'
  const device = useDeviceStore((state) => state)
  const [notificationOnVaultUnlock] = useDeviceStateStore((state) => [
    state.notificationOnVaultUnlock
  ])

  const [notificationOnWrongPasswordAttempts] = useDeviceStateStore((state) => [
    state.notificationOnWrongPasswordAttempts
  ])

  const [loading, setLoading] = useState(false)
  const { lockedState } = device
  const [showPassword, setShowPassword] = useState(false)
  const [tries, setTries] = useState(0)
  const bgColor = useColorModeValue('cyan.800', 'black')

  useEffect(() => {
    RNBootSplash.hide({ fade: true })
    const loadBiometrics = async () => {
      if (device.biometricsAvailable && device.lockedState?.biometricsEnabled) {
        setLoading(true)

        try {
          const psw = await SInfo.getItem('psw', {
            sharedPreferencesName: 'authierShared',
            keychainService: 'authierKCH',
            touchID: true,
            showModal: true,
            strings: {
              header: 'Unlock your vault',
              description: 'decrypt your vault with your fingerprint'
            },
            kSecUseOperationPrompt:
              'We need your permission to retrieve encrypted data'
          })
          unlockVault(psw)
        } catch (error) {
          console.log(error)
          setTries(tries + 1)
          setLoading(false)
        }
      }
    }
    loadBiometrics()
  }, [])

  if (!lockedState || loading) {
    return <Loading />
  }

  if (
    notificationOnWrongPasswordAttempts != 0 &&
    tries >= notificationOnWrongPasswordAttempts
  ) {
    // TODO do this on BE
    // sendAuthMessage({
    //   variables: {
    //     body: ' is trying to unlock your vault',
    //     title: 'Wrong password entered',
    //     type: 'wrongPassword',
    //     deviceId: device.id as string
    //   }
    // })
    setTries(0)
  }

  const unlockVault = async (psw: string) => {
    const masterEncryptionKey = await generateEncryptionKey(
      psw,
      base64ToBuffer(lockedState.encryptionSalt)
    )

    const encryptedDataBuff = base64ToBuffer(lockedState.authSecretEncrypted)
    if (encryptedDataBuff.length < 29) {
      setTries(tries + 1)
      throw new Error('encryptedDataBuff is too small')
    }
    const iv = encryptedDataBuff.slice(16, 16 + 12)
    const data = encryptedDataBuff.slice(16 + 12)

    const decryptedContent = await self.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      masterEncryptionKey,
      data
    )

    const currentAddDeviceSecret = dec.decode(decryptedContent)

    if (currentAddDeviceSecret !== lockedState.authSecret) {
      setTries(tries + 1)
      throw new Error(`Incorrect password`)
    }

    const newState = {
      masterEncryptionKey: await cryptoKeyToString(masterEncryptionKey),
      ...lockedState
    }
    if (lockedState.vaultLockTimeoutSeconds) {
      newState.lockTimeEnd =
        Date.now() + lockedState.vaultLockTimeoutSeconds * 1000
    }
    await device.save(newState)
    device.setLockedState(null)
    setLoading(false)
  }

  return (
    <View p="8" justifyContent="center" backgroundColor={bgColor}>
      <Center>
        <Ionicons color={'black'} size={50} name="lock-closed-outline" />
      </Center>

      <Formik
        initialValues={{ password: '' }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          try {
            await unlockVault(values.password)

            if (notificationOnVaultUnlock) {
              console.log('send notification', device.id)

              // TODO trigger BE mutation: currentDevice { setUnlocked }
              // await sendAuthMessage({
              //   variables: {
              //     body: ' unlocked your vault',
              //     title: 'Vault unlocked',
              //     type: 'vaultUnlocked',
              //     deviceId: device.id as string
              //   }
              // })
            }
            setSubmitting(false)
          } catch (err) {
            setTries(tries + 1)
            if (!toast.isActive(id)) {
              toast.show({
                id,
                render: () => <ToastAlert {...ToastType.LoginFailed} />
              })
            }
          }
        }}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          isSubmitting,
          errors
        }) => (
          <VStack space={5} mt="5">
            <FormControl>
              <FormControl.Label justifyContent="center">
                <Heading size="md">Verify your Master Password</Heading>
              </FormControl.Label>

              <Input
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                InputRightElement={
                  <Icon
                    as={
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        color="grey"
                      />
                    }
                    size={5}
                    mr="2"
                    color="muted.400"
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                type={showPassword ? 'text' : 'password'}
              />

              <FormControl.ErrorMessage>
                {errors.password}
              </FormControl.ErrorMessage>
            </FormControl>

            <Button
              colorScheme="teal"
              isDisabled={values.password.length < 3}
              onPress={handleSubmit as (values) => void}
              isLoading={isSubmitting}
            >
              Unlock vault
            </Button>
          </VStack>
        )}
      </Formik>
    </View>
  )
}
