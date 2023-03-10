import React, { Dispatch, ReactElement, SetStateAction, useState } from 'react'
import {
  Button,
  Box,
  Heading,
  Spinner,
  useColorModeValue,
  VStack
} from '@chakra-ui/react'

import debug from 'debug'

import { t, Trans } from '@lingui/macro'

import { device } from '@src/background/ExtensionDevice'

import { LoginAwaitingApproval } from './LoginAwaitingApproval'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import {
  Form,
  inputFieldSchema,
  inputPswFieldSchema
} from '@src/components/util/tsForm'

const log = debug('au:Login')

export interface LoginFormValues {
  password: string
  email: string
  isSubmitted: boolean
}

// @ts-expect-error TODO: fix types
export const LoginContext = React.createContext<{
  formState: LoginFormValues
  setFormState: Dispatch<SetStateAction<LoginFormValues>>
}>()

const LoginFormSchema = z.object({
  email: inputFieldSchema.describe('Email'),
  password: inputPswFieldSchema.describe(t`Password // Your password`)
})

export default function LoginTest(): ReactElement {
  const [formState, setFormState] = useState<LoginFormValues>({
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
    formState: { isDirty, isSubmitting, isSubmitted },
    reset
  } = form

  if (!device.id) {
    return <Spinner />
  }

  if (isSubmitted) {
    return (
      <LoginContext.Provider value={{ formState, setFormState }}>
        <LoginAwaitingApproval />
      </LoginContext.Provider>
    )
  }
  async function onSubmit(data: z.infer<typeof LoginFormSchema>) {
    setFormState({
      ...data,
      isSubmitted: true
    })
  }

  return (
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
      <Form
        form={form}
        schema={LoginFormSchema}
        onSubmit={onSubmit}
        formProps={{
          isDirty,
          isSubmitting,
          formHeading: t`Login`
        }}
      />
    </VStack>
  )
}
