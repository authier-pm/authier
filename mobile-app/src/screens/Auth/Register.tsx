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
import { IBackgroundStateSerializable } from '@utils/deviceStore'

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
import { useDeviceStore } from '@utils/deviceStore'

import { ILoginFormValues, LoginContext } from './Login'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'

type NavigationProps = NativeStackScreenProps<AuthStackParamList, 'Register'>

export function Register({ navigation }: NavigationProps) {
  const [register, { error }] = useRegisterNewUserMutation()
  const [show, setShow] = useState(false)
  const toast = useToast()
  const id = 'active-toast'
  const device = useDeviceStore((state) => state)
  const deviceState = useDeviceStateStore((state) => state)
  const { formState } = useContext(LoginContext)

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

  // if (!device.fireToken) {
  //   return <Loading />
  // }

  const onSubmit = async (
    values: ILoginFormValues,
    { setSubmitting }: FormikHelpers<ILoginFormValues>
  ) => {
    const userId = uuid.v4()
    //WARNING: Solve permission of uniqueID in google play
    const deviceId = await getUniqueId()
    const deviceName = await getDeviceName()

    if (device.biometricsAvailable && deviceState.biometricsEnabled) {
      try {
        await SInfo.setItem('psw', values.password, {
          sharedPreferencesName: 'authierShared',
          keychainService: 'authierKCH',
          touchID: true,
          showModal: true,
          kSecAccessControl: 'kSecAccessControlBiometryAny'
        })
        useDeviceStateStore.setState({ biometricsEnabled: true })
      } catch (error) {
        console.log(error)
        toast.show({
          title: 'Login failed',
          description:
            'Cannot create account without biometrics, please try again.'
        })
        return
      }
    } else {
      console.log('biometrics not available')
      useDeviceStateStore.setState({ biometricsEnabled: false })
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
    if (registerResult?.accessToken && res.data?.registerNewUser.user) {
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
        vaultLockTimeoutSeconds: 28800,
        autofillTOTPEnabled: registerResult.user.autofillTOTPEnabled,
        autofillCredentialsEnabled:
          registerResult.user.autofillCredentialsEnabled,
        uiLanguage: registerResult.user.uiLanguage,
        lockTimeEnd: Date.now() + 28800000,
        syncTOTP: registerResult.user.defaultDeviceSyncTOTP,
        theme: registerResult.user.defaultDeviceTheme,
        notificationOnWrongPasswordAttempts:
          registerResult.user.notificationOnWrongPasswordAttempts,
        notificationOnVaultUnlock:
          registerResult.user.notificationOnVaultUnlock,
        accessToken: registerResult.accessToken
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
              <HStack mt="2" justifyContent="center" space={1}>
                <Text fontSize="sm" color="muted.700" fontWeight={400}>
                  <Trans>Already have an account.</Trans>
                </Text>
                <Pressable
                  onPress={() =>
                    navigation.navigate('Login', {
                      password: values.password,
                      email: values.email
                    })
                  }
                >
                  <Text
                    color={'indigo.500'}
                    fontWeight={'medium'}
                    fontSize={'sm'}
                  >
                    <Trans>Log in</Trans>
                  </Text>
                </Pressable>
              </HStack>
            </VStack>
          )
        }}
      </Formik>
    </View>
  )
}
