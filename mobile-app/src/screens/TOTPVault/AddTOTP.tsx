import React, { useContext } from 'react'

import { Formik, FormikHelpers } from 'formik'
import { Button, Flex, FormControl, Input } from 'native-base'

import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { DeviceContext } from '../../providers/DeviceProvider'
import { InputHeader } from '../PasswordVault/EditPassword'
import { useNavigation } from '@react-navigation/native'
import { TOTPStackScreenProps } from '../../navigation/types'
import { TotpTypeWithMeta } from '@src/utils/Device'

export const AddTOTP = () => {
  let device = useContext(DeviceContext)
  const navigation =
    useNavigation<TOTPStackScreenProps<'AddTOTP'>['navigation']>()

  return (
    <Formik
      initialValues={{
        url: '',
        secret: '',
        label: '',
        iconUrl: '',
        digits: 6,
        period: 30
      }}
      onSubmit={async (
        values: TotpTypeWithMeta,
        { setSubmitting }: FormikHelpers<TotpTypeWithMeta>
      ) => {
        await device.state?.addSecrets([
          {
            kind: EncryptedSecretType.TOTP,
            totp: values,
            encrypted: device.state.encrypt(JSON.stringify(values)),
            createdAt: new Date().toJSON()
          }
        ])

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
                defaultValue={values.url ?? ''}
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
                defaultValue={values.secret}
                onChangeText={handleChange('secret')}
                onBlur={handleBlur('secret')}
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
