import React, { useContext, useEffect, useState } from 'react'
import SInfo from 'react-native-sensitive-info'
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
import { generateEncryptionKey } from '../../shared/generateEncryptionKey'
import cryptoJS from 'crypto-js'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { DeviceContext } from '../providers/DeviceProvider'
import { Loading } from '@src/components/Loading'
import { ToastAlert } from '@src/components/ToastAlert'
import { ToastType } from '@src/ToastTypes'
import { DeviceState } from '@src/utils/DeviceState'

interface Values {
  password: string
}

export function VaultUnlockVerification() {
  const toast = useToast()
  const id = 'active-toast'
  let device = useContext(DeviceContext)
  const { lockedState } = device
  const [showPassword, setShowPassword] = useState(false)
  const bgColor = useColorModeValue('white', 'black')

  useEffect(() => {
    const loadBiometrics = async () => {
      if (device.biometricsAvailable && device.lockedState?.biometricsEnabled) {
        const psw = await SInfo.getItem('psw', {
          sharedPreferencesName: 'mySharedPrefs',
          keychainService: 'myKeychain',
          touchID: true,
          showModal: true,
          strings: {
            header: 'Unlock your vault',
            description: 'decrypt your vault with your fingerprint'
          },
          kSecUseOperationPrompt:
            'We need your permission to retrieve encrypted data'
        })

        await unlockVault(psw)
      }
    }
    loadBiometrics()
  }, [])

  if (!lockedState) {
    return <Loading />
  }

  const unlockVault = async (psw: string) => {
    const masterEncryptionKey = generateEncryptionKey(
      psw,
      lockedState!.encryptionSalt
    )

    const currentAddDeviceSecret = cryptoJS.AES.decrypt(
      lockedState.authSecretEncrypted,
      masterEncryptionKey,
      {
        iv: cryptoJS.enc.Utf8.parse(lockedState.userId)
      }
    ).toString(cryptoJS.enc.Utf8)

    if (currentAddDeviceSecret !== lockedState.authSecret) {
      throw new Error(`Incorrect password`)
    }

    device.state = new DeviceState({
      masterEncryptionKey,
      ...lockedState
    })
    device.state.lockTimeEnd = Date.now() + lockedState.lockTime * 1000
    await device.save()
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

            setSubmitting(false)
          } catch (err: any) {
            console.log(err)

            toast.show({
              title: 'Login failed',
              description: err.message
            })
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
              onPress={handleSubmit}
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
