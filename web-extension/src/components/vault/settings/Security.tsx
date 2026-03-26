import {
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Select,
  VStack,
  useColorModeValue
} from '@src/components/ui/legacy'
import {
  useUpdateSettingsMutation,
  SyncSettingsDocument
} from '@shared/graphql/Settings.codegen'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { useContext } from 'react'
import { Trans } from '@lingui/react/macro'

import { Field, Formik, FormikHelpers } from 'formik'
import { useVaultLockTimeoutOptions } from '@src/util/useVaultLockTimeoutOptions'

interface Values {
  vaultLockTimeoutSeconds: number
  uiLanguage: string
  autofillCredentialsEnabled: boolean
  autofillTOTPEnabled: boolean
  syncTOTP: boolean
  notificationOnWrongPasswordAttempts: number
  notificationOnVaultUnlock: boolean
}

export default function Security() {
  const { setSecuritySettings, deviceState } = useContext(DeviceStateContext)
  const options = useVaultLockTimeoutOptions()

  const [updateSettings] = useUpdateSettingsMutation({
    refetchQueries: [{ query: SyncSettingsDocument, variables: {} }]
  })

  if (deviceState) {
    return (
      <VStack
        width={'70%'}
        maxW="600px"
        alignItems={'normal'}
        mt={8}
        spacing={20}
        rounded={'lg'}
        className="Security"
        boxShadow={'lg'}
        p={30}
        bg={useColorModeValue('cyan.800', 'gray.800')}
      >
        <Formik
          initialValues={{
            autofillTOTPEnabled: deviceState.autofillTOTPEnabled,
            autofillCredentialsEnabled: deviceState.autofillCredentialsEnabled,
            uiLanguage: deviceState.uiLanguage,
            syncTOTP: deviceState.syncTOTP,
            vaultLockTimeoutSeconds: deviceState.vaultLockTimeoutSeconds,
            notificationOnVaultUnlock: deviceState.notificationOnVaultUnlock,
            notificationOnWrongPasswordAttempts:
              deviceState.notificationOnWrongPasswordAttempts
          }}
          onSubmit={async (
            values: Values,
            { setSubmitting, resetForm }: FormikHelpers<Values>
          ) => {
            const config = {
              ...values,
              vaultLockTimeoutSeconds: parseInt(
                values.vaultLockTimeoutSeconds.toString()
              )
            }

            await updateSettings({
              variables: {
                config
              }
            })
            setSecuritySettings(config)
            resetForm({ values: config })
            setSubmitting(false)
          }}
        >
          {({ isSubmitting, dirty, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="flex-start">
                <FormControl>
                  <FormLabel htmlFor="vaultLockTimeoutSeconds">
                    <Trans>Lock time</Trans>
                  </FormLabel>
                  <Field
                    as={Select}
                    id="vaultLockTimeoutSeconds"
                    name="vaultLockTimeoutSeconds"
                  >
                    {options.map((option, index) => (
                      <option value={option.value.toString()} key={index}>
                        {option.label}
                      </option>
                    ))}
                  </Field>
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="uiLanguage">Language</FormLabel>
                  <Field as={Select} id="uiLanguage" name="uiLanguage">
                    <option value="en">English</option>
                    <option value="cs">Čeština</option>
                  </Field>
                </FormControl>

                <Field name="autofillCredentialsEnabled">
                  {({ field }) => (
                    <Checkbox
                      id="autofillCredentialsEnabled"
                      name="autofillCredentialsEnabled"
                      isChecked={field.value}
                      mr={5}
                      {...field}
                    >
                      <Trans>Credentials autofill</Trans>
                    </Checkbox>
                  )}
                </Field>

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

                <Field name="syncTOTP">
                  {({ field }) => (
                    <Checkbox
                      id="syncTOTP"
                      name="syncTOTP"
                      isChecked={field.value}
                      mr={5}
                      {...field}
                    >
                      <Trans>2FA sync</Trans>
                    </Checkbox>
                  )}
                </Field>

                <Field name="notificationOnWrongPasswordAttempts">
                  {({ field, form }) => (
                    <input
                      className="h-10 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3"
                      id="notificationOnWrongPasswordAttempts"
                      min={0}
                      name="notificationOnWrongPasswordAttempts"
                      style={{ marginRight: '20px' }}
                      type="number"
                      value={field.value}
                      onChange={(event) => {
                        form.setFieldValue(field.name, parseInt(event.target.value))
                      }}
                    />
                  )}
                </Field>

                <Field name="notificationOnVaultUnlock">
                  {({ field }) => (
                    <Checkbox
                      id="notificationOnVaultUnlock"
                      name="notificationOnVaultUnlock"
                      isChecked={field.value}
                      mr={5}
                      {...field}
                    >
                      <Trans>Notification on vault unlock</Trans>
                    </Checkbox>
                  )}
                </Field>

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
                  <Trans>Save</Trans>
                </Button>
              </VStack>
            </form>
          )}
        </Formik>
      </VStack>
    )
  }
  return null
}
