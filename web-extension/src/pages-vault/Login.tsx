import React, { Dispatch, ReactElement, SetStateAction, useState } from 'react'
import { Box, Button, Flex, Spinner, Text } from '@chakra-ui/react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { device } from '@src/background/ExtensionDevice'
import { LoginAwaitingApproval } from './LoginAwaitingApproval'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  Form,
  inputEmailFieldSchema,
  inputPswFieldSchema
} from '@src/components/util/tsForm'

const LoginFormSchema = z.object({
  email: inputEmailFieldSchema.describe('Email'),
  password: inputPswFieldSchema.describe(t`Password // *******`)
})

export interface LoginFormValues {
  password: string
  email: string
  isSubmitted: boolean
}

// @ts-expect-error TODO: fix types
export const LoginContext = React.createContext<{
  formStateContext: LoginFormValues
  setFormStateContext: Dispatch<SetStateAction<LoginFormValues>>
}>()

const SubmitButton = ({ isSubmitting }: { isSubmitting: boolean }) => {
  return (
    <Button
      colorScheme="teal"
      variant="outline"
      type="submit"
      width="full"
      mt={4}
      isLoading={isSubmitting}
    >
      <Trans>Submit</Trans>
    </Button>
  )
}

export default function Login(): ReactElement {
  const [formStateContext, setFormStateContext] = useState<LoginFormValues>({
    password: '',
    email: '',
    isSubmitted: false
  })

  const form = useForm<z.infer<typeof LoginFormSchema>>({
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onChange'
  })

  const {
    formState: { isSubmitting }
  } = form

  if (!device.id) {
    return <Spinner />
  }

  if (formStateContext.isSubmitted) {
    return (
      <LoginContext.Provider
        value={{
          formStateContext,
          setFormStateContext
        }}
      >
        <LoginAwaitingApproval />
      </LoginContext.Provider>
    )
  }

  async function onSubmit(data: z.infer<typeof LoginFormSchema>) {
    setFormStateContext({
      ...data,
      isSubmitted: true
    })
  }

  return (
    <Box p={8} borderWidth={1} borderRadius={6} boxShadow="lg" minW="400px">
      <Form
        // @ts-ignore TODO figure out why this always has type error on CI
        form={form}
        schema={LoginFormSchema}
        onSubmit={onSubmit}
        formProps={{
          formHeading: t`Login`,
          submitButton: <SubmitButton isSubmitting={isSubmitting} />
        }}
      />
      <Flex>
        <Link to="/signup">
          <Text pt={3}>
            <Trans>Don't have account?</Trans>
          </Text>
        </Link>
      </Flex>
    </Box>
  )
}
