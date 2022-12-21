import React, { useContext, useState } from 'react'

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
import { passwordStrength } from 'check-password-strength'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { useNavigation } from '@react-navigation/native'
import { DeviceContext } from '../../providers/DeviceProvider'
import { InputHeader } from './EditPassword'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { PasswordStackScreenProps } from '../../navigation/types'
import { ToastAlert } from '../../components/ToastAlert'
import { ToastType } from '../../ToastTypes'
import { loginCredentialsSchema } from '@src/utils/loginCredentialsSchema'
import { PasswordSchema, credentialValues } from '@shared/formikSharedTypes'

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
  let device = useContext(DeviceContext)
  const navigation =
    useNavigation<PasswordStackScreenProps<'AddPassword'>['navigation']>()

  const toast = useToast()
  const id = 'active-toast'

  return (
    <Formik
      initialValues={{
        url: '',
        password: '',
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
          await device.state?.addSecrets([
            {
              kind: EncryptedSecretType.LOGIN_CREDENTIALS,
              loginCredentials: unencryptedData,
              encrypted: device.state.encrypt(JSON.stringify(unencryptedData)),
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
        const levelOfPsw = passwordStrength(values.password)

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
