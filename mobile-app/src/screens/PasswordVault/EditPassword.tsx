import React, { useContext, useState, useLayoutEffect, useEffect } from 'react'

import {
  Alert,
  Button,
  Flex,
  FormControl,
  Icon,
  Input,
  Progress,
  Text,
  useColorModeValue,
  View
} from 'native-base'

import Ionicons from 'react-native-vector-icons/Ionicons'
import { Formik, FormikHelpers } from 'formik'

import { DeleteSecretAlert } from '@components/DeleteSecretAlert'

import { ILoginSecret, ITOTPSecret } from '@utils/deviceStore'
import {
  EncryptedSecretsDocument,
  useUpdateEncryptedSecretMutation
} from '@shared/graphql/EncryptedSecrets.codegen'
import { PasswordStackScreenProps } from '@navigation/types'
import { credentialValues, PasswordSchema } from '@shared/formikSharedTypes'
import { Loading } from '@components/Loading'
import zxcvbn from 'zxcvbn-typescript'
import { useDeviceStateStore } from '@utils/deviceStateStore'

export const InputHeader = ({ children }) => {
  return (
    <FormControl.Label
      _text={{
        color: useColorModeValue('coolGray.800', 'coolGray.100'),
        fontSize: 'xl',
        fontWeight: 500
      }}
    >
      {children}
    </FormControl.Label>
  )
}
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

const LoginSecret = (secretProps: ILoginSecret) => {
  const { loginCredentials } = secretProps
  const [show, setShow] = useState(false)
  const deviceState = useDeviceStateStore((state) => state)

  const [updateSecret] = useUpdateEncryptedSecretMutation({
    refetchQueries: [{ query: EncryptedSecretsDocument, variables: {} }]
  })

  return (
    <View>
      <Formik
        initialValues={{
          url: loginCredentials.url!!,
          password: loginCredentials.password,
          label: loginCredentials.label,
          username: loginCredentials.username
        }}
        validationSchema={PasswordSchema}
        onSubmit={async (
          values: credentialValues,
          { setSubmitting, resetForm }: FormikHelpers<credentialValues>
        ) => {
          const secret = deviceState.secrets.find(
            ({ id }) => id === secretProps.id
          )
          if (secret && deviceState) {
            secret.encrypted = await deviceState.encrypt(
              JSON.stringify({
                password: values.password,
                username: values.username,
                url: values.url,
                label: values.label,
                iconUrl: null
              })
            )

            await updateSecret({
              variables: {
                id: secretProps.id,
                patch: {
                  encrypted: secret.encrypted,
                  kind: secretProps.kind
                }
              }
            })

            deviceState.save()

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
        }) => {
          const passwordScore = zxcvbn(values.password).score // Estimate password strength from 0 to 4
          const progress = passwordScore * 25 // Convert the score to a percentage

          return (
            <Flex p={5} flexDirection="column">
              <InputField
                errors={errors}
                values={values}
                name="url"
                handleBlur={handleBlur}
                handleChange={handleChange}
                header="URL"
              />
              <InputField
                errors={errors}
                values={values}
                name="label"
                handleBlur={handleBlur}
                handleChange={handleChange}
                header="Label"
              />

              <InputField
                errors={errors}
                values={values}
                name="username"
                handleBlur={handleBlur}
                handleChange={handleChange}
                header="Username"
              />

              <FormControl isInvalid={'password' in errors}>
                <InputHeader>Password:</InputHeader>
                <Input
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                  type={show ? 'text' : 'password'}
                  size={'lg'}
                  InputRightElement={
                    <Icon
                      as={
                        <Ionicons
                          name={show ? 'eye-outline' : 'eye-off-outline'}
                        />
                      }
                      size={6}
                      mr="2"
                      color="muted.400"
                      onPress={() => setShow(!show)}
                    />
                  }
                />
                <Progress
                  value={progress}
                  size="xs"
                  colorScheme="green"
                  max={4}
                  mb={1}
                />
                <FormControl.ErrorMessage>
                  {errors.password}
                </FormControl.ErrorMessage>
              </FormControl>

              {secretProps.loginCredentials.parseError && (
                <Alert status="error" mt={4}>
                  <Text>Failed to parse this secret:</Text>
                  {JSON.stringify(secretProps.loginCredentials.parseError)}
                </Alert>
              )}

              <Button
                rounded={15}
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
          )
        }}
      </Formik>
    </View>
  )
}

export default function EditPassword({
  navigation,
  route
}: PasswordStackScreenProps<'EditPassword'>) {
  let deviceState = useDeviceStateStore((state) => state)
  const [secret, setSecret] = useState<
    ITOTPSecret | ILoginSecret | undefined | null
  >(null)

  useEffect(() => {
    async function loadSecret() {
      const secret = await deviceState.getSecretDecryptedById(
        route.params.loginSecret.id
      )
      setSecret(secret)
    }
    loadSecret()
  }, [])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useLayoutEffect(() => {
    if (secret) {
      console.log('secret', secret.id)
      navigation.setOptions({
        headerRight: () => <DeleteSecretAlert id={secret?.id} />
      })
    }
  }, [navigation, secret])

  if (!deviceState) {
    return <Loading />
  }

  if (!secret) {
    return <Loading />
  }

  return <LoginSecret {...(secret as ILoginSecret)} />
}
