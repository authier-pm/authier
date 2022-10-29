import React, { useContext } from 'react'

import { Formik, FormikHelpers } from 'formik'
import {
  Box,
  Button,
  Flex,
  FormControl,
  HStack,
  Input,
  ScrollView
} from 'native-base'
import * as Yup from 'yup'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { DeviceContext } from '../../providers/DeviceProvider'
import { InputHeader } from '../PasswordVault/EditPassword'
import { useNavigation } from '@react-navigation/native'
import { TOTPStackScreenProps } from '../../navigation/types'
import { TotpTypeWithMeta } from '@src/utils/Device'

export const TOTPSchema = Yup.object().shape({
  url: Yup.string().url('Invalid URL').required('Required'),
  label: Yup.string().required('Required'),
  secret: Yup.string().required('Required'),
  iconUrl: Yup.string().url('Invalid URL').nullable(),
  digits: Yup.number().min(6).max(8).required('Required'),
  period: Yup.number().min(30).max(120).required('Required')
})

const InputField = ({
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
        value={values[name]}
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
  let device = useContext(DeviceContext)
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
          handleSubmit,
          errors,
          isValid
        }) => {
          return (
            <Flex p={5} flexDirection="column">
              <InputField
                errors={errors}
                header="URL"
                name="url"
                {...{ values, handleBlur, handleChange }}
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
                header="Digits"
                name="digits"
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
                onPress={handleSubmit}
                isDisabled={isSubmitting || !dirty || !isValid}
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
