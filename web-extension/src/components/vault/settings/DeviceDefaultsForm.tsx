import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Spinner,
  VStack
} from '@chakra-ui/react'

import {
  useDefaultSettingsQuery,
  useUpdateDefaultDeviceSettingsMutation
} from '@shared/graphql/DefaultSettings.codegen'
import {
  DefaultsFormSchema,
  defaultsFormProps
} from '@src/pages-vault/DefaultSettings'
import { vaultLockTimeoutOptions } from '@shared/constants'
import { Formik, FormikHelpers, Field } from 'formik'

interface Values {
  vaultLockTimeoutSeconds: number
  autofillCredentialsEnabled: boolean
  autofillTOTPEnabled: boolean
  syncTOTP: boolean
  uiLanguage: string
  theme: string
}

export function DeviceDefaultsForm() {
  const { data, loading } = useDefaultSettingsQuery()
  const [updateDefaultSettings] = useUpdateDefaultDeviceSettingsMutation({})
  const bgColor = useColorModeValue('white', 'gray.800')

  if (loading || !data) return <Spinner />

  return (
    <VStack
      width={'70%'}
      maxW="600px"
      alignItems={'normal'}
      mt={8}
      spacing={20}
      rounded={'lg'}
      boxShadow={'lg'}
      p={30}
      bg={bgColor}
    >
      <Formik
        initialValues={{
          autofillTOTPEnabled:
            data?.me.defaultDeviceSettings.autofillTOTPEnabled,
          autofillCredentialsEnabled:
            data?.me.defaultDeviceSettings.autofillCredentialsEnabled,
          syncTOTP: data?.me.defaultDeviceSettings.syncTOTP,
          vaultLockTimeoutSeconds:
            data?.me.defaultDeviceSettings.vaultLockTimeoutSeconds,
          theme: data?.me.defaultDeviceSettings.theme,
          uiLanguage: data?.me.uiLanguage
        }}
        onSubmit={async (
          values: Values,
          { setSubmitting, resetForm }: FormikHelpers<Values>
        ) => {
          console.log(values)
          const config = {
            ...values,
            vaultLockTimeoutSeconds: parseInt(
              values.vaultLockTimeoutSeconds.toString()
            )
          }
          await updateDefaultSettings({
            variables: {
              config
            }
          })
          resetForm({ values: config })
          setSubmitting(false)
        }}
      >
        {({ isSubmitting, dirty, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="flex-start">
              <FormControl>
                <FormLabel htmlFor="vaultLockTimeoutSeconds">
                  Lock time
                </FormLabel>
                <Field
                  as={Select}
                  id="vaultLockTimeoutSeconds"
                  name="vaultLockTimeoutSeconds"
                >
                  {vaultLockTimeoutOptions.map((option, index) => (
                    <option value={option.value.toString()} key={index}>
                      {option.label}
                    </option>
                  ))}
                </Field>
              </FormControl>

              {/*  */}

              <FormControl>
                <FormLabel htmlFor="uiLanguage">Language</FormLabel>
                <Field as={Select} id="uiLanguage" name="uiLanguage">
                  <option value="en">English</option>
                  <option value="cs">Čeština</option>
                </Field>
              </FormControl>

              {/*  */}

              <Field name="autofillCredentialsEnabled">
                {({ field }) => (
                  <Checkbox
                    id="autofillCredentialsEnabled"
                    name="autofillCredentialsEnabled"
                    isChecked={field.value}
                    mr={5}
                    {...field}
                  >
                    Credentials autofill
                  </Checkbox>
                )}
              </Field>

              {/*  */}
              <Field name="autofillTOTPEnabled">
                {({ field }) => (
                  <Checkbox
                    id="autofillTOTPEnabled"
                    name="autofillTOTPEnabled"
                    isChecked={field.value}
                    mr={5}
                    {...field}
                  >
                    TOTP autofill
                  </Checkbox>
                )}
              </Field>

              {/*  */}
              <Field name="syncTOTP">
                {({ field }) => (
                  <Checkbox
                    id="syncTOTP"
                    name="syncTOTP"
                    isChecked={field.value}
                    mr={5}
                    {...field}
                  >
                    2FA sync
                  </Checkbox>
                )}
              </Field>
              {/*  */}
              <FormControl>
                <FormLabel htmlFor="theme">Language</FormLabel>
                <Field as={Select} id="theme" name="theme">
                  <option value="Dark">Dark</option>
                  <option value="Light">Light</option>
                </Field>
              </FormControl>

              <Button
                isDisabled={isSubmitting || !dirty}
                isLoading={isSubmitting}
                type="submit"
                bg={'blue.400'}
                color={'white'}
                boxShadow={
                  '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
                }
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
            </VStack>
          </form>
        )}
      </Formik>
    </VStack>
  )
}
