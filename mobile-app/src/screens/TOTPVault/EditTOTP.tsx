import React, { useContext, useLayoutEffect } from 'react'

import {
  Alert,
  Button,
  Flex,
  FormControl,
  Input,
  Spinner,
  View
} from 'native-base'

import { Formik, FormikHelpers } from 'formik'

import { DeleteSecretAlert } from '../../components/DeleteSecretAlert'
import { DeviceContext } from '../../providers/DeviceProvider'
import { ITOTPSecret } from '../../utils/Device'
import { useUpdateEncryptedSecretMutation } from '@shared/graphql/EncryptedSecrets.codegen'
import { TOTPStackScreenProps } from '../../navigation/types'
import { InputHeader } from '../PasswordVault/EditPassword'
import { TOTPSchema, totpValues } from '@shared/formikSharedTypes'
import { useQuery } from 'react-query'

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
        defaultValue={values[name]}
        onChangeText={handleChange(name)}
        onBlur={handleBlur(name)}
        isRequired
        size={'lg'}
      />
      <FormControl.ErrorMessage>{errors[name]}</FormControl.ErrorMessage>
    </FormControl>
  )
}

const TOTPSecret = (data: ITOTPSecret) => {
  const { totp } = data
  const [updateSecret] = useUpdateEncryptedSecretMutation()
  let device = useContext(DeviceContext)

  return (
    <View>
      <Formik
        initialValues={{
          secret: totp.secret,
          url: totp.url!!,
          label: totp.label,
          digits: totp.digits,
          period: totp.period
        }}
        validationSchema={TOTPSchema}
        onSubmit={async (
          values: totpValues,
          { setSubmitting, resetForm }: FormikHelpers<totpValues>
        ) => {
          const secret = device.state?.secrets.find(({ id }) => id === data.id)

          if (secret && device.state) {
            secret.encrypted = await device.state.encrypt(
              JSON.stringify({
                ...values,
                iconUrl: '',
                digits: 6,
                period: 30
              })
            )

            await updateSecret({
              variables: {
                id: data.id,
                patch: {
                  encrypted: secret.encrypted,
                  kind: data.kind
                }
              }
            })

            await device.state?.save()
            resetForm({ values })
            setSubmitting(false)
          }
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
        }) => (
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
          </Flex>
        )}
      </Formik>
    </View>
  )
}

export default function EditTOTP({
  navigation,
  route
}: TOTPStackScreenProps<'EditTOTP'>) {
  let device = useContext(DeviceContext)

  const { isLoading, data } = useQuery('repoData', () => {
    return device.state?.getSecretDecryptedById(route.params.item.id)
  })
  const secret = data

  useLayoutEffect(() => {
    if (secret) {
      navigation.setOptions({
        headerRight: () => <DeleteSecretAlert id={secret?.id} />
      })
    }
  }, [navigation, secret])

  if (isLoading) return 'Loading...'

  if (!device.state || isLoading) {
    return <Spinner />
  }

  if (!secret) {
    return <Alert>Could not find this secret, it may be deleted</Alert>
  }

  return <TOTPSecret {...(secret as ITOTPSecret)} />
}
