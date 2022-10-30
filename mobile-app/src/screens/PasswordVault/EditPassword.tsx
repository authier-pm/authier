import React, { useContext, useState, useLayoutEffect } from 'react'

import {
  Alert,
  Button,
  Flex,
  FormControl,
  Icon,
  Input,
  Progress,
  Spinner,
  Text,
  useColorModeValue,
  View
} from 'native-base'

import Ionicons from 'react-native-vector-icons/Ionicons'
import { passwordStrength } from 'check-password-strength'
import { Formik, FormikHelpers } from 'formik'

import { DeleteSecretAlert } from '@components/DeleteSecretAlert'

import { DeviceContext } from '@providers/DeviceProvider'
import { ILoginSecret } from '@utils/Device'
import {
  EncryptedSecretsDocument,
  useUpdateEncryptedSecretMutation
} from '@shared/graphql/EncryptedSecrets.codegen'
import { PasswordStackScreenProps } from '@navigation/types'
import { credentialValues, PasswordSchema } from '@shared/formikSharedTypes'

interface LoginParsedValues {
  url: string
  label: string
  username: string
  password: string
}

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
  let device = useContext(DeviceContext)

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
          const secret = device.state?.secrets.find(
            ({ id }) => id === secretProps.id
          )
          if (secret && device.state) {
            secret.encrypted = device.state.encrypt(
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
          isValid,
          errors
        }) => {
          const levelOfPsw = passwordStrength(values.password)

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
                  value={levelOfPsw.id}
                  size="xs"
                  colorScheme="green"
                  max={3}
                  min={0}
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
  let device = useContext(DeviceContext)

  if (!device.state) {
    return <Spinner />
  }

  console.log('route.params.secretId', route.params.loginSecret)
  const secret = device.state.getSecretDecryptedById(
    route.params.loginSecret.id
  )

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useLayoutEffect(() => {
    if (secret) {
      navigation.setOptions({
        headerRight: () => <DeleteSecretAlert id={secret?.id} />
      })
    }
  }, [navigation, secret])

  if (!secret) {
    return <Alert>Could not find this secret, it may be deleted</Alert>
  }

  return <LoginSecret {...(secret as ILoginSecret)} />
}
