import {
  Box,
  FormControl,
  FormLabel,
  Button,
  Spinner,
  useColorModeValue,
  VStack,
  FormHelperText,
  Checkbox,
  Select
} from '@chakra-ui/react'
import { Formik, FormikHelpers, Field, FieldProps } from 'formik'
import { device } from '@src/background/ExtensionDevice'
import React, { useContext } from 'react'
import { motion } from 'framer-motion'
import { Trans } from '@lingui/macro'

import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { ISecuritySettings } from '@src/util/useDeviceState'

export default function VaultConfig() {
  const email = device.state?.email
  const { setSecuritySettings } = useContext(DeviceStateContext)

  if (!email) {
    return <Spinner />
  }

  // Split to container component to avoid rewriting the same code twice (Account and VaultConfig)
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      style={{
        display: 'contents'
      }}
    >
      <VStack
        width={'70%'}
        maxW="600px"
        alignItems={'normal'}
        spacing={20}
        rounded={'lg'}
        boxShadow={'lg'}
        p={30}
        bg={useColorModeValue('white', 'gray.800')}
      >
        <Box textAlign="start">
          <Formik
            initialValues={{
              vaultLockTime: device.state?.lockTime || '0',
              twoFA: false,
              autofill: true,
              language: 'en'
            }}
            onSubmit={async (
              values: ISecuritySettings,
              { setSubmitting }: FormikHelpers<ISecuritySettings>
            ) => {
              setSecuritySettings(values)
              setSubmitting(false)
            }}
          >
            {({ dirty, handleSubmit, errors, touched, values }) => (
              <form onSubmit={handleSubmit}>
                <VStack spacing={4} align="flex-start">
                  <FormControl
                    isInvalid={!!errors.vaultLockTime && touched.vaultLockTime}
                  >
                    <FormLabel htmlFor="vaultLockTime">
                      <Trans>Lock time</Trans>
                    </FormLabel>
                    <Field as={Select} id="vaultLockTime" name="vaultLockTime">
                      <option value={20}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={3600}>1 hour</option>
                      <option value={14400}>4 hour</option>
                      <option value={28800}>8 hours</option>
                      <option value={86400}>1 day</option>
                      <option value={604800}>1 week</option>
                      <option value={2592000}>1 month</option>
                      <option value={0}>Never</option>
                    </Field>
                    <FormHelperText>
                      <Trans>
                        Automatically locks vault after chosen period of time
                      </Trans>
                    </FormHelperText>
                  </FormControl>

                  {/* Not ideal, later refactor */}
                  <Field name="twoFA">
                    {({ field, form }: FieldProps) => {
                      const { onChange, ...rest } = field
                      return (
                        <FormControl
                          id="twoFA"
                          isInvalid={
                            !!form.errors['twoFA'] && !!form.touched['twoFA']
                          }
                        >
                          <Checkbox
                            {...rest}
                            id="twoFA"
                            onChange={onChange}
                            defaultChecked={values.twoFA}
                          >
                            2FA
                          </Checkbox>
                        </FormControl>
                      )
                    }}
                  </Field>

                  {/* Not ideal, later refactor */}
                  <Field name="autofill">
                    {({ field, form }: FieldProps) => {
                      const { onChange, ...rest } = field
                      return (
                        <FormControl
                          id="autofill"
                          isInvalid={
                            !!form.errors['autofill'] &&
                            !!form.touched['autofill']
                          }
                        >
                          <Checkbox
                            {...rest}
                            id="autofill"
                            onChange={onChange}
                            defaultChecked={values.autofill}
                          >
                            <Trans>Autofill</Trans>
                          </Checkbox>
                        </FormControl>
                      )
                    }}
                  </Field>

                  {/*  */}
                  <FormControl
                    isInvalid={!!errors.language && touched.language}
                  >
                    <FormLabel htmlFor="language">
                      <Trans>Language</Trans>
                    </FormLabel>
                    <Field as={Select} id="language" name="language">
                      <option value="en">English</option>
                      <option value="cz">Čeština</option>
                    </Field>
                  </FormControl>
                  {/* Resolve dirty */}
                  <Button
                    mt={4}
                    colorScheme="teal"
                    disabled={!dirty}
                    type="submit"
                  >
                    <Trans>Save</Trans>
                  </Button>
                </VStack>
              </form>
            )}
          </Formik>
        </Box>
      </VStack>
    </motion.div>
  )
}
