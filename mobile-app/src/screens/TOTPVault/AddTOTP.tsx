import React, { useContext } from 'react'

import { Formik, FormikHelpers } from 'formik'
import { Button, Flex, FormControl, Input, ScrollView } from 'native-base'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { DeviceContext } from '../../providers/DeviceProvider'
import { InputHeader } from '../PasswordVault/EditPassword'
import { useNavigation } from '@react-navigation/native'
import { TOTPStackScreenProps } from '../../navigation/types'
import { TotpTypeWithMeta } from '@src/utils/Device'
import { TOTPSchema } from '@shared/formikSharedTypes'

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

              <InputField
                errors={errors}
                header="Period"
                name="period"
                {...{ values, handleBlur, handleChange }}
              />

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
