import {
  Stack,
  Button,
  Flex,
  Input,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Box
} from '@chakra-ui/react'
import React from 'react'

import { Field, Formik, FormikHelpers } from 'formik'
import { device } from '../../../background/ExtensionDevice'
import { EncryptedSecretsType } from '../../../generated/graphqlBaseTypes'
import { useNavigate } from 'react-router-dom'
import { TotpTypeWithMeta } from '../../../util/useDeviceState'
import { TOTPSchema } from '../../../../../shared/formikSharedTypes'

export const AddTOTP = () => {
  const navigate = useNavigate()

  return (
    <Box width={{ base: '90%', sm: '70%', lg: '60%', xl: '70%' }}>
      <Formik
        enableReinitialize
        initialValues={{
          url: '',
          secret: '',
          label: '',
          iconUrl: '',
          digits: 6,
          period: 30
        }}
        validationSchema={TOTPSchema}
        onSubmit={async (
          values: TotpTypeWithMeta,
          { setSubmitting }: FormikHelpers<TotpTypeWithMeta>
        ) => {
          await device.state?.addSecrets([
            {
              kind: EncryptedSecretsType.TOTP as any,
              totp: values,
              encrypted: device.state!.encrypt(JSON.stringify(values)),
              createdAt: new Date().toJSON()
            }
          ])

          setSubmitting(false)
          navigate(-1)
        }}
      >
        {({ isSubmitting, handleSubmit, dirty, errors, touched }) => {
          return (
            <form onSubmit={handleSubmit}>
              <Flex p={5} flexDirection="column" w="inherit">
                <FormControl isInvalid={!!errors.url && touched.url}>
                  <FormLabel htmlFor="url">URL:</FormLabel>
                  <Field as={Input} id="url" name="url" />
                  <FormErrorMessage>{errors.url}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.label && touched.label}>
                  <FormLabel htmlFor="label">Label:</FormLabel>
                  <Field as={Input} id="label" name="label" />
                  <FormErrorMessage>{errors.label}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.secret && touched.secret}>
                  <FormLabel htmlFor="secret">Secret:</FormLabel>
                  <Field as={Input} id="secret" name="secret" />
                  <FormErrorMessage>{errors.secret}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.digits && touched.digits}>
                  <FormLabel htmlFor="digits">Digits:</FormLabel>
                  <Field as={Input} id="digits" name="digits" />
                  <FormErrorMessage>{errors.digits}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.period && touched.period}>
                  <FormLabel htmlFor="period">Period:</FormLabel>
                  <Field as={Input} id="period" name="period" />
                  <FormErrorMessage>{errors.period}</FormErrorMessage>
                </FormControl>
                <Stack
                  direction={'row'}
                  justifyContent="flex-end"
                  spacing={1}
                  my={5}
                  alignItems={'baseline'}
                >
                  <Button
                    _focus={{
                      bg: 'gray.200'
                    }}
                    fontSize={'sm'}
                    size="sm"
                    onClick={() => navigate('/')}
                  >
                    Go back
                  </Button>
                  <Button
                    disabled={isSubmitting || !dirty}
                    isLoading={isSubmitting}
                    type="submit"
                    size={'sm'}
                    fontSize={'sm'}
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
                    aria-label="Create"
                  >
                    Create
                  </Button>
                </Stack>
              </Flex>
            </form>
          )
        }}
      </Formik>
    </Box>
  )
}
