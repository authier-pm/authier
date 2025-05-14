import {
  useToast,
  Spinner,
  Box,
  Button,
  Heading,
  VStack,
  useColorModeValue,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'
import { t } from '@lingui/core/macro'

import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useDeviceDecryptionChallengeMutation } from '@shared/graphql/Login.codegen'
import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import { device } from '@src/background/ExtensionDevice'
import {
  decryptDeviceSecretWithPassword,
  generateEncryptionKey,
  base64ToBuffer,
  cryptoKeyToString
} from '@src/util/generateEncryptionKey'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useChangeMasterPasswordMutation,
  useDeleteAccountMutation
} from './Account.codegen'
import { useDevicesRequestsQuery } from '@shared/graphql/AccountDevices.codegen'
import { Trans } from '@lingui/react/macro'

const AccountFormSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email address' })
    .describe('Email'),
  currPassword: z
    .string()
    .min(process.env.NODE_ENV === 'development' ? 1 : 8, {
      message: `Password must be at least ${process.env.NODE_ENV === 'development' ? 1 : 8} characters`
    })
    .describe(t`Current password // Master password`),
  newPassword: z
    .string()
    .min(process.env.NODE_ENV === 'development' ? 1 : 8, {
      message: `Password must be at least ${process.env.NODE_ENV === 'development' ? 1 : 8} characters`
    })
    .describe(t`Set new master password // New master password`),
  confirmPassword: z
    .string()
    .min(process.env.NODE_ENV === 'development' ? 1 : 8, {
      message: `Password must be at least ${process.env.NODE_ENV === 'development' ? 1 : 8} characters`
    })
    .describe(t`Confirm new password // Confirm password`)
})

export const SettingsSubmitButton = ({
  isSubmitting,
  isDirty
}: {
  isSubmitting: boolean
  isDirty: boolean
}) => {
  return (
    <Button
      mt={4}
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
      aria-label="Submit"
      type="submit"
      isDisabled={isSubmitting || !isDirty}
      isLoading={isSubmitting}
    >
      <Trans>Submit</Trans>
    </Button>
  )
}

export default function Account() {
  const email = device.state?.email
  const [changePassword] = useChangeMasterPasswordMutation()
  const [deviceDecryptionChallenge] = useDeviceDecryptionChallengeMutation()
  const toast = useToast()

  const [showPasswords, setShowPasswords] = useState(false)

  if (!email) {
    return <Spinner />
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful }
  } = useForm<z.infer<typeof AccountFormSchema>>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: {
      email: email,
      currPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    mode: 'onChange'
  })

  async function onSubmit(data: z.infer<typeof AccountFormSchema>) {
    try {
      if (data.newPassword !== data.confirmPassword) {
        toast({ title: t`Passwords do not match`, status: 'error' })
        return
      }

      const { addDeviceSecret } = await decryptDeviceSecretWithPassword(
        data.currPassword,
        device.state as IBackgroundStateSerializable
      )

      if (addDeviceSecret !== device.state?.authSecret) {
        toast({ title: t`Wrong password`, status: 'error' })
        return
      }

      const { state } = device

      if (state && data.newPassword === data.confirmPassword) {
        const newEncryptionKey = await generateEncryptionKey(
          data.newPassword,
          base64ToBuffer(state.encryptionSalt)
        )

        const decryptionChallenge = await deviceDecryptionChallenge({
          variables: {
            deviceInput: {
              id: device.id as string,
              name: device.name,
              platform: device.platform
            },
            email: data.email
          }
        })

        const secrets = state.secrets

        const newDeviceSecretsPair = await device.initLocalDeviceAuthSecret(
          newEncryptionKey,
          base64ToBuffer(state.encryptionSalt)
        )

        await changePassword({
          variables: {
            secrets: await device.serializeSecrets(secrets, data.newPassword),
            addDeviceSecret: newDeviceSecretsPair.addDeviceSecret,
            addDeviceSecretEncrypted:
              newDeviceSecretsPair.addDeviceSecretEncrypted,
            decryptionChallengeId: decryptionChallenge.data
              ?.deviceDecryptionChallenge?.id as number
          }
        })

        const deviceState: IBackgroundStateSerializable = {
          ...state,
          authSecret: newDeviceSecretsPair.addDeviceSecret,
          authSecretEncrypted: newDeviceSecretsPair.addDeviceSecretEncrypted,
          masterEncryptionKey: await cryptoKeyToString(newEncryptionKey)
        }
        device.save(deviceState)

        toast({
          title: t`Password changed, all your other devices will be logged out and you will need to log in again`,
          status: 'success'
        })
      } else {
        toast({ title: t`Wrong password`, status: 'error' })
      }
    } catch (err: any) {
      toast({
        title: err.message,
        colorScheme: 'red'
      })
    }
  }

  useEffect(() => {
    reset({
      email: email,
      currPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }, [isSubmitSuccessful])
  const { data: devicesRequests } = useDevicesRequestsQuery({
    fetchPolicy: 'cache-and-network'
  })

  const isMasterDevice = device.id === devicesRequests?.me.masterDeviceId

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
      bg={useColorModeValue('cyan.800', 'gray.800')}
    >
      <Box>
        <Heading as="h3" size="lg" mb={5}>
          <Trans>Change vault password</Trans>
        </Heading>
        {isMasterDevice ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4} align="flex-start">
              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input type="email" {...register('email')} />
                {errors.email && (
                  <FormErrorMessage>{errors.email.message}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.currPassword}>
                <FormLabel>
                  <Trans>Current password</Trans>
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    {...register('currPassword')}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                {errors.currPassword && (
                  <FormErrorMessage>
                    {errors.currPassword.message}
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.newPassword}>
                <FormLabel>
                  <Trans>Set new master password</Trans>
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    {...register('newPassword')}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                {errors.newPassword && (
                  <FormErrorMessage>
                    {errors.newPassword.message}
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel>
                  <Trans>Confirm new password</Trans>
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    {...register('confirmPassword')}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                {errors.confirmPassword && (
                  <FormErrorMessage>
                    {errors.confirmPassword.message}
                  </FormErrorMessage>
                )}
              </FormControl>

              <SettingsSubmitButton
                isDirty={isDirty}
                isSubmitting={isSubmitting}
              />
            </VStack>
          </form>
        ) : (
          <Trans>
            You can only change the password on the master device, "
            {device.name}" is just a regular device
          </Trans>
        )}
      </Box>
      <Box bg={'orange.100'} rounded={'lg'} p={3}>
        <Heading as="h3" size="lg" color={'red'} mb={5}>
          <Trans>Danger zone</Trans>
        </Heading>
        <DeleteAccountButton />
      </Box>
    </VStack>
  )
}

const DeleteAccountButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<any>()

  const [deleteAccount] = useDeleteAccountMutation()

  return (
    <>
      <Button colorScheme={'red'} onClick={async () => onOpen()}>
        <Trans>Delete your account</Trans>
      </Button>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Customer
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? You cannot undo this action afterwards. Make sure to
              backup data that you want to keep.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={async () => {
                  await deleteAccount()
                  onClose()
                  await device.clearAndReload()
                }}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}
