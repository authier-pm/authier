import { useContext, useEffect, useState } from 'react'
import {
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Center
} from '@chakra-ui/react'

import { useForm } from 'react-hook-form'
import { LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import {
  cryptoKeyToString,
  decryptDeviceSecretWithPassword
} from '@util/generateEncryptionKey'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { toast } from '@src/ExtensionProviders'

interface FormValues {
  password: string
}

export function UnlockDeviceForm({ onUnlocked }: { onUnlocked: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<FormValues>({
    defaultValues: {
      password: ''
    }
  })

  const password = watch('password')

  const { setDeviceState, lockedState, device } = useContext(DeviceStateContext)

  useEffect(() => {
    if (lockedState === null) {
      onUnlocked()
    }
  }, [lockedState])

  if (!lockedState) {
    return null
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const { addDeviceSecret, masterEncryptionKey } =
        await decryptDeviceSecretWithPassword(values.password, lockedState)

      if (addDeviceSecret !== lockedState.authSecret) {
        throw new Error(t`Incorrect password`)
      }

      setDeviceState({
        masterEncryptionKey: await cryptoKeyToString(masterEncryptionKey),
        ...lockedState
      })

      if (lockedState.vaultLockTimeoutSeconds) {
        device.startLockInterval(lockedState.vaultLockTimeoutSeconds)
      }

      onUnlocked()
    } catch (err: any) {
      if (
        err.message ===
        'DOMException: The operation failed for an operation-specific reason'
      ) {
        toast({
          title: 'Incorrect password',
          status: 'error',
          isClosable: true
        })
      } else {
        toast({
          title: err.message,
          status: 'error',
          isClosable: true
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Flex flexDirection="column" minWidth="315px" p={4}>
      <Center>
        <LockIcon boxSize="50px" mx={20} my={3}></LockIcon>
      </Center>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl isInvalid={!!errors.password}>
          <FormLabel htmlFor="password">
            <Heading size="md">Re-enter your Master Password</Heading>
          </FormLabel>
          <InputGroup>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Password is required'
              })}
            />
            <InputRightElement width="3rem">
              <Button
                h="1.5rem"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <ViewOffIcon /> : <ViewIcon />}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
        </FormControl>

        <Button
          colorScheme="teal"
          variant="outline"
          isDisabled={!password || password.length < 3}
          type="submit"
          width="full"
          mt={4}
          isLoading={isSubmitting}
        >
          <Trans>Unlock vault</Trans>
        </Button>
      </form>
    </Flex>
  )
}
