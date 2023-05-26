import { Formik, FormikHelpers } from 'formik'
import {
  Heading,
  VStack,
  FormControl,
  Input,
  Button,
  Text,
  View,
  Pressable,
  HStack,
  Icon
} from 'native-base'
import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react'

import Ionicons from 'react-native-vector-icons/Ionicons'
import { Trans } from '@lingui/macro'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AuthStackParamList } from '@navigation/AuthNavigation'
import { LoginAwaitingApproval } from './LoginAwaitingApproval'
import { Loading } from '@src/components/Loading'
import { useDeviceStore } from '@src/utils/deviceStore'

export interface ILoginFormValues {
  email: string
  password: string
  submitted: boolean
}

type NavigationProps = NativeStackScreenProps<AuthStackParamList, 'Login'>

export const LoginContext = React.createContext<{
  formState: ILoginFormValues
  setFormState: Dispatch<SetStateAction<ILoginFormValues>>
}>({} as any)

export function Login({ navigation }: NavigationProps) {
  const [loading, setLoading] = useState(false)
  const [show, setShow] = React.useState(false)
  const { formState, setFormState } = useContext(LoginContext)

  const device = useDeviceStore((state) => state)

  useEffect(() => {
    if (!device.fireToken) {
      setLoading(true)
    }
    setLoading(false)
  }, [device.fireToken])

  if (loading) {
    return <Loading />
  }

  if (formState.submitted) {
    return <LoginAwaitingApproval />
  }

  return (
    <View p="8" justifyContent="center">
      <Heading fontWeight="600">
        <Trans>Welcome</Trans>
      </Heading>
      <Heading mt="1" fontWeight="medium" size="xs">
        <Trans>Log in to continue!</Trans>
      </Heading>

      <Formik
        initialValues={formState}
        enableReinitialize
        onSubmit={async (
          values: ILoginFormValues,
          { setSubmitting }: FormikHelpers<ILoginFormValues>
        ) => {
          setFormState({
            ...values,
            submitted: true
          })
          setSubmitting(false)
        }}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          isSubmitting,
          errors
        }) => {
          return (
            <VStack space={3} mt="5">
              <FormControl>
                <FormControl.Label
                  _text={{
                    fontSize: 'xl',
                    fontWeight: 500
                  }}
                >
                  Email
                </FormControl.Label>
                <Input
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                />

                <FormControl.ErrorMessage>
                  {errors.email}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl>
                <FormControl.Label
                  _text={{
                    fontSize: 'xl',
                    fontWeight: 500
                  }}
                >
                  Password
                </FormControl.Label>
                <Input
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                  type={show ? 'text' : 'password'}
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

                <FormControl.ErrorMessage>
                  {errors.password}
                </FormControl.ErrorMessage>
              </FormControl>

              <Button
                onPress={handleSubmit as (values: any) => void}
                isLoading={isSubmitting}
              >
                <Trans>Submit</Trans>
              </Button>
              <HStack mt="2" justifyContent="center" space={1}>
                <Text fontSize="sm" color="muted.500" fontWeight={400}>
                  <Trans>I'm a new user.</Trans>
                </Text>
                <Pressable
                  onPress={() =>
                    navigation.navigate('Register', {
                      password: values.password,
                      email: values.email
                    })
                  }
                >
                  <Text
                    color={'indigo.500'}
                    fontWeight={'medium'}
                    fontSize={'sm'}
                  >
                    <Trans>Sign Up</Trans>
                  </Text>
                </Pressable>
              </HStack>
              {/* <Button onPress={() => navigation.navigate('QRLogin')}>
              With QR Code
            </Button> */}
            </VStack>
          )
        }}
      </Formik>
    </View>
  )
}
