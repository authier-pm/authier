import React, { useState } from 'react'

import { Formik, FormikHelpers } from 'formik'
import {
  Flex,
  FormControl,
  Input,
  Icon,
  Progress,
  Button,
  useToast
} from 'native-base'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { useNavigation } from '@react-navigation/native'
import { loginCredentialsSchema } from '@shared/loginCredentialsSchema'
import { InputHeader } from './EditPassword'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { PasswordStackScreenProps } from '../../navigation/types'
import { ToastAlert } from '../../components/ToastAlert'
import { ToastType } from '../../ToastTypes'

import { PasswordSchema, credentialValues } from '@shared/formikSharedTypes'
import zxcvbn from 'zxcvbn-typescript'
import {
  defaultPasswordGeneratorConfig,
  generate
} from '@shared/passwordGenerator'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'

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

export const AddPassword = () => {
  const [show, setShow] = useState(false)
  const [addSecrets, encrypt] = useDeviceStateStore((state) => [
    state.addSecrets,
    state.encrypt
  ])
  const navigation =
    useNavigation<PasswordStackScreenProps<'AddPassword'>['navigation']>()

  const toast = useToast()
  const id = 'active-toast'

  return (
    <Formik
      initialValues={{
        url: '',
        password: generate(defaultPasswordGeneratorConfig),
        label: '',
        username: ''
      }}
      validationSchema={PasswordSchema}
      onSubmit={async (
        values: credentialValues,
        { setSubmitting }: FormikHelpers<credentialValues>
      ) => {
        const unencryptedData = {
          password: values.password,
          username: values.username,
          url: values.url,
          label: values.label,
          iconUrl: null
        }

        loginCredentialsSchema.parse(unencryptedData)

        try {
          await addSecrets([
            {
              kind: EncryptedSecretType.LOGIN_CREDENTIALS,
              loginCredentials: unencryptedData,
              encrypted: await encrypt(JSON.stringify(unencryptedData)),
              createdAt: new Date().toJSON()
            }
          ])
        } catch (error: any) {
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

        setSubmitting(false)

        navigation.navigate('PasswordsVault')
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
              {...{
                errors,
                values,
                name: 'label',
                header: 'Label',
                handleBlur,
                handleChange
              }}
            />

            <InputField
              {...{
                errors,
                values,
                name: 'username',
                handleChange,
                handleBlur,
                header: 'Username'
              }}
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
        )
      }}
    </Formik>
  )
}
