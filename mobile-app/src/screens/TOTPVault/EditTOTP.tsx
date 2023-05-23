import React, { useEffect, useLayoutEffect, useState } from 'react'

import { Alert, Input, Button, Flex, FormControl, View } from 'native-base'

import { Formik, FormikHelpers } from 'formik'

import { DeleteSecretAlert } from '../../components/DeleteSecretAlert'

import { ILoginSecret, ITOTPSecret } from '../../utils/Device'
import { useUpdateEncryptedSecretMutation } from '@shared/graphql/EncryptedSecrets.codegen'
import { TOTPStackScreenProps } from '../../navigation/types'
import { TOTPSchema, totpValues } from '@shared/formikSharedTypes'
import { InputHeader } from '../PasswordVault/EditPassword'
import { SyncEncryptedSecretsDocument } from '@shared/graphql/ExtensionDevice.codegen'
import { Loading } from '@src/components/Loading'
import { useTestStore } from '@src/utils/deviceStateStore'

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
        defaultValue={values[name].toString()}
        onChangeText={handleChange(name)}
        onBlur={handleBlur(name)}
        size={'lg'}
      />
      <FormControl.ErrorMessage>{errors[name]}</FormControl.ErrorMessage>
    </FormControl>
  )
}

const TOTPSecret = (data: ITOTPSecret) => {
  const { totp } = data
  let deviceState = useTestStore((state) => state)
  const [updateSecret] = useUpdateEncryptedSecretMutation({
    refetchQueries: [{ query: SyncEncryptedSecretsDocument, variables: {} }]
  })

  return (
    <View>
      <Formik
        initialValues={{
          secret: totp.secret,
          url: totp.url ?? '',
          label: totp.label,
          digits: totp.digits,
          period: totp.period
        }}
        validationSchema={TOTPSchema}
        onSubmit={async (
          values: totpValues,
          { setSubmitting, resetForm }: FormikHelpers<totpValues>
        ) => {
          const secret = deviceState.secrets.find(({ id }) => id === data.id)

          if (secret && deviceState) {
            secret.encrypted = await deviceState.encrypt(
              JSON.stringify({
                ...values,
                iconUrl: ''
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

            await deviceState.save()
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
          errors
        }) => (
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

export function EditTOTP({
  navigation,
  route
}: TOTPStackScreenProps<'EditTOTP'>) {
  let deviceState = useTestStore((state) => state)
  const [secret, setSecret] = useState<
    ITOTPSecret | ILoginSecret | undefined | null
  >(null)

  //TODO: Change to react-query, invalidate cache on update
  useEffect(() => {
    async function loadSecret() {
      const secret = await deviceState.getSecretDecryptedById(
        route.params.item.id
      )
      setSecret(secret)
    }
    loadSecret()
  }, [])

  useLayoutEffect(() => {
    if (secret) {
      navigation.setOptions({
        headerRight: () => <DeleteSecretAlert id={secret?.id} />
      })
    }
  }, [navigation, secret])

  if (secret === null || !deviceState) {
    return <Loading />
  }

  if (secret === undefined) {
    return <Alert>Could not find this secret, it may be deleted</Alert>
  }

  return <TOTPSecret {...(secret as ITOTPSecret)} />
}
