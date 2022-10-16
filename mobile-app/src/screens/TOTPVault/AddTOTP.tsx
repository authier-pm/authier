import React, { useContext } from 'react'

import { Formik, FormikHelpers } from 'formik'
import { Button, Flex, FormControl, Input } from 'native-base'

import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { DeviceContext } from '../../providers/DeviceProvider'
import { InputHeader } from '../PasswordVault/EditPassword'
import { useNavigation } from '@react-navigation/native'
import { TOTPStackScreenProps } from '../../navigation/types'

interface LoginParsedValues {
  url: string
  totp: string
  encrypted: string
  label: string
}

export const AddTOTP = () => {
  let device = useContext(DeviceContext)
  const navigation =
    useNavigation<TOTPStackScreenProps<'AddTOTP'>['navigation']>()

  return (
    <Formik
      initialValues={{
        url: '',
        totp: '',
        encrypted: '',
        label: ''
      }}
      onSubmit={async (
        values: LoginParsedValues,
        { setSubmitting }: FormikHelpers<LoginParsedValues>
      ) => {
        const unencryptedData = {
          totp: values.totp,
          url: values.url,
          label: values.label
        }

        await device.state?.addSecrets([
          {
            kind: EncryptedSecretType.TOTP,
            totp: values.totp,
            encrypted: device.state.encrypt(JSON.stringify(unencryptedData)),
            createdAt: new Date().toJSON()
          }
        ])

        console.log(values)
        setSubmitting(false)
        navigation.goBack()
      }}
    >
      {({
        values,
        isSubmitting,
        dirty,
        handleChange,
        handleBlur,
        handleSubmit
      }) => {
        return (
          <Flex p={5} flexDirection="column">
            <FormControl>
              <InputHeader>URL:</InputHeader>
              <Input
                defaultValue={values.url}
                onChangeText={handleChange('url')}
                onBlur={handleBlur('url')}
                isRequired
                size={'lg'}
              />
            </FormControl>

            <FormControl>
              <InputHeader>Label:</InputHeader>

              <Input
                defaultValue={values.label}
                isRequired
                onChangeText={handleChange('label')}
                onBlur={handleBlur('label')}
                size={'lg'}
              />
            </FormControl>

            <FormControl>
              <InputHeader>OTP:</InputHeader>

              <Input
                defaultValue={values.totp}
                onChangeText={handleChange('totp')}
                onBlur={handleBlur('totp')}
                isRequired
                size={'lg'}
              />
            </FormControl>

            <Button
              mt={5}
              onPress={handleSubmit}
              isDisabled={isSubmitting || !dirty}
              isLoading={isSubmitting}
              size={'md'}
              fontSize={'sm'}
              bg={'blue.400'}
              color={'white'}
              _hover={{
                bg: 'blue.500'
              }}
              _focus={{
                bg: 'blue.500'
              }}
              aria-label="Save"
            >
              Save
            </Button>

            <Button
              onPress={() => navigation.navigate('QRScan')}
              mt={5}
              size={'md'}
              fontSize={'sm'}
              bg={'blue.400'}
              color={'white'}
              _hover={{
                bg: 'blue.500'
              }}
              _focus={{
                bg: 'blue.500'
              }}
              aria-label="Save"
            >
              Scan QR Code
            </Button>
          </Flex>
        )
      }}
    </Formik>
  )
}
