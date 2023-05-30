import React from 'react'

import { Formik, FormikHelpers } from 'formik'
import { Button, Flex, FormControl, Input, ScrollView } from 'native-base'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { InputHeader } from '../PasswordVault/EditPassword'
import { useNavigation } from '@react-navigation/native'
import { TOTPStackScreenProps } from '../../navigation/types'
import { TotpTypeWithMeta } from '@utils/deviceStore'
import { TOTPSchema } from '@shared/formikSharedTypes'
import { useDeviceStateStore } from '@utils/deviceStateStore'

export const InputField = ({
  errors,
  values,
  name,
  handleBlur,
  handleChange,
  header
}) => {
  return (
    <FormControl isInvalid={name in errors}>
      <InputHeader>{header}:</InputHeader>
      <Input
        value={values[name].toString()}
        onChangeText={handleChange(name)}
        onBlur={handleBlur(name)}
        isRequired
        size={'lg'}
      />
      <FormControl.ErrorMessage>{errors[name]}</FormControl.ErrorMessage>
    </FormControl>
  )
}

export const AddTOTP = () => {
  let deviceState = useDeviceStateStore((state) => state)
  const navigation =
    useNavigation<TOTPStackScreenProps<'AddTOTP'>['navigation']>()

  return (
    <ScrollView>
      <Formik
        initialValues={{
          url: '',
          secret: '',
          label: '',
          iconUrl: '',
          digits: 6,
          period: 30
        }}
        validationSchema={TOTPSchema}
        onSubmit={async (
          values: TotpTypeWithMeta,
          { setSubmitting }: FormikHelpers<TotpTypeWithMeta>
        ) => {
          await deviceState.addSecrets([
            {
              kind: EncryptedSecretType.TOTP,
              totp: values,
              encrypted: await deviceState.encrypt(JSON.stringify(values)),
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
          handleSubmit,
          errors
        }) => {
          return (
            <Flex p={5} flexDirection="column">
              <InputField
                {...{
                  errors,
                  values,
                  name: 'url',
                  handleBlur,
                  handleChange,
                  header: 'URL'
                }}
              />

              <InputField
                errors={errors}
                header="Label"
                name="label"
                {...{ values, handleBlur, handleChange }}
              />

              <InputField
                errors={errors}
                header="Secret"
                name="secret"
                {...{ values, handleBlur, handleChange }}
              />

              <InputField
                errors={errors}
                header="Period"
                name="period"
                {...{ values, handleBlur, handleChange }}
              />

              <Button
                mt={5}
                onPress={handleSubmit as (values: any) => void}
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
    </ScrollView>
  )
}
