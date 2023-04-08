import React, { useContext, useEffect, useState } from 'react'
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
  useToast,
  Icon
} from 'native-base'
import { useRegisterNewUserMutation } from '@shared/graphql/registerNewUser.codegen'
import uuid from 'react-native-uuid'
import { getDeviceName, getUniqueId } from 'react-native-device-info'
import { DeviceContext } from '../../providers/DeviceProvider'
import { IBackgroundStateSerializable } from '@utils/Device'
import { saveAccessToken } from '@utils/tokenFromAsyncStorage'
import SInfo from 'react-native-sensitive-info'
import { Platform } from 'react-native'
import { Loading } from '@components/Loading'
import { Trans } from '@lingui/macro'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../navigation/AuthNavigation'
import { ToastAlert } from '@components/ToastAlert'
import { ToastType } from '../../ToastTypes'
import Ionicons from 'react-native-vector-icons/Ionicons'
import {
  bufferToBase64,
  cryptoKeyToString,
  generateEncryptionKey
} from '@src/utils/generateEncryptionKey'

import { ILoginFormValues, LoginContext } from './Login'

type NavigationProps = NativeStackScreenProps<AuthStackParamList, 'Register'>

export function Register({ navigation }: NavigationProps) {
  const [register, { error }] = useRegisterNewUserMutation()
  const [show, setShow] = useState(false)
  const toast = useToast()
  const id = 'active-toast'
  let device = useContext(DeviceContext)
  const { formState, setFormState } = useContext(LoginContext)

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

  const onSubmit = async (
    values: ILoginFormValues,
    { setSubmitting }: FormikHelpers<ILoginFormValues>
  ) => {
    const userId = uuid.v4()
    //WARNING: Solve permission of uniqueID in google play
    const deviceId = await getUniqueId()
    const deviceName = await getDeviceName()

    if (device.biometricsAvailable) {
      await SInfo.setItem('psw', values.password, {
        sharedPreferencesName: 'authierShared',
        keychainService: 'authierKCH',
        touchID: true,
        showModal: true,
        kSecAccessControl: 'kSecAccessControlBiometryAny'
      })
    }

    const encryptionSalt = self.crypto.getRandomValues(new Uint8Array(16))

    const masterEncryptionKey = await generateEncryptionKey(
      values.password,
      encryptionSalt
    )

    const params = await device.initLocalDeviceAuthSecret(
      masterEncryptionKey,
      encryptionSalt
    )

    const res = await register({
      variables: {
        userId: userId,
        input: {
          deviceId: deviceId,
          ...params,
          deviceName: deviceName,
          email: values.email,
          encryptionSalt: bufferToBase64(encryptionSalt),
          firebaseToken: device.fireToken as string,
          devicePlatform: Platform.OS
        }
      }
    })

    const registerResult = res.data?.registerNewUser

    //FIX: Maybe we should check if is the access token valid?
    if (registerResult?.accessToken) {
      await saveAccessToken(registerResult.accessToken)
      const stringKey = await cryptoKeyToString(masterEncryptionKey)

      const newDeviceState: IBackgroundStateSerializable = {
        masterEncryptionKey: stringKey,
        userId: userId as string,
        secrets: [],
        email: values.email,
        deviceName: device.name,
        encryptionSalt: bufferToBase64(encryptionSalt),
        authSecret: params.addDeviceSecret,
        authSecretEncrypted: params.addDeviceSecretEncrypted,
        lockTime: 28800,
        autofillTOTPEnabled: false,
        autofillCredentialsEnabled: false,
        uiLanguage: 'en',
        lockTimeEnd: Date.now() + 28800000,
        syncTOTP: false,
        theme: 'dark'
      }

      device.save(newDeviceState)
      setSubmitting(false)
    }
    setSubmitting(false)
  }
  return (
    <View p="8" justifyContent="center">
      <Heading size="lg" fontWeight="600">
        Welcome
      </Heading>
      <Heading mt="1" fontWeight="medium" size="xs">
        Beware that authier is in beta, so we advise not to use it for important
        passwords just yet. We will assess the security of the app before we
        recommend it for important passwords.
      </Heading>

      <Formik initialValues={formState} enableReinitialize onSubmit={onSubmit}>
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          isSubmitting
        }) => {
          setFormState(values)

          return (
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
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
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
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                  autoCapitalize="none"
                  type={show ? 'text' : 'password'}
                  InputRightElement={
                    <Icon
                      as={
                        <Ionicons
                          name={show ? 'eye-outline' : 'eye-off-outline'}
                        />
                      }
                      size={5}
                      mr="2"
                      color="muted.400"
                      onPress={() => setShow(!show)}
                    />
                  }
                  placeholder="Password"
                />
                <FormControl.ErrorMessage>
                  {errors.password}
                </FormControl.ErrorMessage>
              </FormControl>

              <Button
                onPress={handleSubmit as (values: any) => void}
                isLoading={isSubmitting}
              >
                Register
              </Button>
            </VStack>
          )
        }}
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
