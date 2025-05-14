import React, { Dispatch, ReactElement, SetStateAction, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Spinner,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Heading,
  VStack,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { device } from '@src/background/ExtensionDevice'
import { LoginAwaitingApproval } from './LoginAwaitingApproval'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

const LoginFormSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email address' })
    .describe('Email'),
  password: z
    .string()
    .min(process.env.NODE_ENV === 'development' ? 1 : 8, {
      message: `Password must be at least ${process.env.NODE_ENV === 'development' ? 1 : 8} characters`
    })
    .describe(t`Password // *******`)
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

  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof LoginFormSchema>>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onChange'
  })

  if (!device.id) {
    return <Spinner />
  }
  console.log('formStateContext:', formStateContext)

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

  const onSubmit = async (data: z.infer<typeof LoginFormSchema>) => {
    setFormStateContext({
      ...data,
      isSubmitted: true
    })
  }

  return (
    <Box p={8} borderWidth={1} borderRadius={6} boxShadow="lg" minW="400px">
      <Box>
        <Heading as="h3" size="lg" mb={5}>
          <Trans>Login</Trans>
        </Heading>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4} align="flex-start">
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input type="email" {...register('email')} />
              {errors.email && (
                <FormErrorMessage>{errors.email.message}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.password}>
              <FormLabel>
                <Trans>Password</Trans>
              </FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
              {errors.password && (
                <FormErrorMessage>{errors.password.message}</FormErrorMessage>
              )}
            </FormControl>
            <SubmitButton isSubmitting={isSubmitting} />
          </VStack>
        </form>
      </Box>
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
