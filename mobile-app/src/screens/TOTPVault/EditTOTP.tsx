import React, { useContext, useLayoutEffect, useState } from 'react'

import {
  Alert,
  Button,
  Flex,
  FormControl,
  Icon,
  Input,
  Spinner,
  useColorModeValue,
  View
} from 'native-base'

import { Formik, FormikHelpers } from 'formik'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { DeleteSecretAlert } from '../../components/DeleteSecretAlert'
import { DeviceContext } from '../../providers/DeviceProvider'
import { ITOTPSecret } from '../../utils/Device'
import { useUpdateEncryptedSecretMutation } from '../../../../shared/graphql/ItemSettings.codegen'
import { TOTPStackScreenProps } from '../../navigation/types'

interface totpValues {
  secret: string
  url: string
  label: string
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

const TOTPSecret = (data: ITOTPSecret) => {
  const [updateSecret] = useUpdateEncryptedSecretMutation()
  const [show, setShow] = useState(false)
  let device = useContext(DeviceContext)

  return (
    <View>
      <Formik
        initialValues={{
          secret: data.totp,
          url: data.url!!,
          label: data.label
        }}
        onSubmit={async (
          values: totpValues,
          { setSubmitting, resetForm }: FormikHelpers<totpValues>
        ) => {
          const secret = device.state?.secrets.find(({ id }) => id === data.id)

          if (secret && device.state) {
            secret.encrypted = device.state.encrypt(
              JSON.stringify({
                totp: values.secret,
                url: values.url,
                label: values.label
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
          handleSubmit
        }) => (
          <Flex p={5} flexDirection="column">
            <FormControl>
              <InputHeader>URL:</InputHeader>

              <Input
                defaultValue={values.url}
                onChangeText={handleChange('url')}
                onBlur={handleBlur('url')}
                isRequired
              />
            </FormControl>

            <FormControl>
              <FormControl.Label
                _text={{
                  color: 'coolGray.800',
                  fontSize: 'xl',
                  fontWeight: 500
                }}
              >
                Password
              </FormControl.Label>

              <Input
                onChangeText={handleChange('label')}
                onBlur={handleBlur('label')}
                defaultValue={values.label}
                isRequired
              />
            </FormControl>

            <FormControl>
              <FormControl.Label
                _text={{
                  color: 'coolGray.800',
                  fontSize: 'xl',
                  fontWeight: 500
                }}
              >
                Secret:
              </FormControl.Label>

              <Input
                pr="4.5rem"
                type={show ? 'text' : 'password'}
                defaultValue={values.secret}
                onChangeText={handleChange('secret')}
                onBlur={handleBlur('secret')}
                isRequired
                InputRightElement={
                  <Icon
                    as={
                      <Ionicons
                        name={show ? 'eye-outline' : 'eye-off-outline'}
                      />
                    }
                    size={5}
                    mr="2"
                    color="muted.400"
                    onPress={() => setShow(!show)}
                  />
                }
                placeholder="Password"
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

  if (!device.state) {
    return <Spinner />
  }

  const secret = device.state.getSecretDecryptedById(route.params.item.id)

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

  return <TOTPSecret {...(secret as ITOTPSecret)} />
}
