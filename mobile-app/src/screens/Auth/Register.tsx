import React, { useContext, useEffect } from 'react'
import { Formik, FormikHelpers } from 'formik'
import {
  Heading,
  VStack,
  FormControl,
  Input,
  Button,
  View,
  Pressable,
  Text,
  HStack,
  useToast
} from 'native-base'
import { useRegisterNewUserMutation } from '@shared/graphql/registerNewUser.codegen'
import uuid from 'react-native-uuid'
import { getDeviceName } from 'react-native-device-info'
import { generateEncryptionKey } from '../../../shared/generateEncryptionKey'
import { DeviceContext } from '../../providers/DeviceProvider'
import { IBackgroundStateSerializable, DeviceState } from '@utils/Device'
import { saveAccessToken } from '@utils/tokenFromAsyncStorage'
import SInfo from 'react-native-sensitive-info'
import { Platform } from 'react-native'
import { Loading } from '@components/Loading'
import { Trans } from '@lingui/macro'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../navigation/AuthNavigation'
import { ToastAlert } from '@components/ToastAlert'
import { ToastType } from '../../ToastTypes'

interface Values {
  password: string
  email: string
}

type NavigationProps = NativeStackScreenProps<AuthStackParamList, 'Register'>

export function Register({ navigation }: NavigationProps) {
  const [register, { error }] = useRegisterNewUserMutation()
  const toast = useToast()
  const id = 'active-toast'
  let device = useContext(DeviceContext)

  useEffect(() => {
    if (error) {
      if (!toast.isActive(id)) {
        toast.show({
          id,
          render: () => (
            <ToastAlert
              {...ToastType.NetworkError}
              description={error.message}
            />
          )
        })
      }
    }
  }, [error])

  if (!device.fireToken) {
    return <Loading />
  }

  return (
    <View p="8" justifyContent="center">
      <Heading size="lg" fontWeight="600">
        Welcome
      </Heading>
      <Heading mt="1" fontWeight="medium" size="xs">
        Register!
      </Heading>

      <Formik
        initialValues={{ email: 'bob@bob.com', password: 'bob' }}
        onSubmit={async (
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          const userId = uuid.v4()
          const encryptionSalt = device.generateBackendSecret()
          const deviceName = await getDeviceName()

          if (device.biometricsAvailable) {
            await SInfo.setItem('psw', values.password, {
              sharedPreferencesName: 'mySharedPrefs',
              keychainService: 'myKeychain',
              touchID: true,
              showModal: true,
              kSecAccessControl: 'kSecAccessControlBiometryAny'
            })
          }

          const masterEncryptionKey = generateEncryptionKey(
            values.password,
            encryptionSalt
          )

          const params = device.initLocalDeviceAuthSecret(
            masterEncryptionKey,
            userId as string
          )
          const deviceId = await device.getDeviceId()

          const res = await register({
            variables: {
              userId: userId,
              input: {
                deviceId: deviceId,
                addDeviceSecret: params?.addDeviceSecret,
                addDeviceSecretEncrypted: params?.addDeviceSecretEncrypted,
                deviceName: deviceName,
                email: values.email,
                encryptionSalt: encryptionSalt,
                firebaseToken: device.fireToken as string,
                devicePlatform: Platform.OS
              }
            }
          })
          const registerResult = res.data?.registerNewUser

          if (registerResult?.accessToken) {
            await saveAccessToken(registerResult.accessToken)

            const deviceState: IBackgroundStateSerializable = {
              masterEncryptionKey: masterEncryptionKey,
              userId: userId as string,
              secrets: [],
              email: values.email,
              deviceName: device.name,
              encryptionSalt,
              authSecret: params?.addDeviceSecret as string,
              authSecretEncrypted: params?.addDeviceSecretEncrypted as string,
              lockTime: 28800,
              autofill: false,
              language: 'en',
              lockTimeEnd: Date.now() + 28800000,
              lockTimerRunning: false,
              syncTOTP: false,
              theme: 'dark'
            }

            device.state = new DeviceState(deviceState)
            device.save()
            setSubmitting(false)
          }
          setSubmitting(false)
        }}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          isSubmitting
        }) => (
          <VStack space={3} mt="5">
            <FormControl>
              <FormControl.Label
                _text={{
                  fontSize: 'xl',
                  fontWeight: 500
                }}
              >
                Email
              </FormControl.Label>

              <Input
                onBlur={handleBlur('email')}
                onChangeText={handleChange('email')}
                value={values.email}
              />
              <FormControl.ErrorMessage>
                {errors.email}
              </FormControl.ErrorMessage>
            </FormControl>

            <FormControl>
              <FormControl.Label
                _text={{
                  fontSize: 'xl',
                  fontWeight: 500
                }}
              >
                Password
              </FormControl.Label>
              <Input
                onBlur={handleBlur('password')}
                onChangeText={handleChange('password')}
                value={values.password}
                type="password"
              />
            </FormControl>

            <Button onPress={handleSubmit} isLoading={isSubmitting}>
              Register
            </Button>
          </VStack>
        )}
      </Formik>
      <HStack mt="2" justifyContent="center" space={1}>
        <Text fontSize="sm" color="muted.700" fontWeight={400}>
          <Trans>Already have an account.</Trans>
        </Text>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text color={'indigo.500'} fontWeight={'medium'} fontSize={'sm'}>
            <Trans>Log in</Trans>
          </Text>
        </Pressable>
      </HStack>
    </View>
  )
}
