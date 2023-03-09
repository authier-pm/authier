import {
  useToast,
  Spinner,
  Box,
  Button,
  Heading,
  VStack,
  useColorModeValue
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { useDeviceDecryptionChallengeMutation } from '@shared/graphql/Login.codegen'
import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import { device } from '@src/background/ExtensionDevice'
import {
  decryptDeviceSecretWithPassword,
  generateEncryptionKey,
  base64ToBuffer
} from '@src/util/generateEncryptionKey'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Form, inputFieldSchema, inputPswFieldSchema } from '../../util/tsForm'
import { useChangeMasterPasswordMutation } from './Account.codegen'

const AccountFormSchema = z.object({
  email: inputFieldSchema.describe('Email'),
  currPassword: inputPswFieldSchema.describe(
    'Current password // Master password'
  ),
  newPassword: inputPswFieldSchema.describe(
    'Set new master password // New master password'
  ),
  confirmPassword: inputPswFieldSchema.describe(
    'Confirm new password // Confirm password'
  )
})

export default function Account() {
  const email = device.state?.email
  const [changePassword] = useChangeMasterPasswordMutation()
  const [deviceDecryptionChallenge] = useDeviceDecryptionChallengeMutation()
  const toast = useToast()

  if (!email) {
    return <Spinner />
  }

  const form = useForm<z.infer<typeof AccountFormSchema>>({
    defaultValues: {
      email: email,
      currPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    mode: 'onChange'
  })

  const {
    formState: { isDirty, isSubmitting, isSubmitSuccessful },
    reset
  } = form

  async function onSubmit(data: z.infer<typeof AccountFormSchema>) {
    try {
      const { addDeviceSecret } = await decryptDeviceSecretWithPassword(
        data.currPassword,
        device.state as IBackgroundStateSerializable
      )

      if (addDeviceSecret !== device.state?.authSecret) {
        toast({ title: t`Wrong password`, status: 'error' })
        return
      }

      if (data.newPassword !== data.confirmPassword) {
        toast({ title: t`Passwords do not match`, status: 'error' })
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
        schema={AccountFormSchema}
        onSubmit={onSubmit}
        formProps={{
          isDirty,
          isSubmitting,
          formHeading: 'Change vault password'
        }}
      />
      <Box>
        <Heading as="h3" size="lg" color={'red'} mb={5}>
          <Trans>Danger zone</Trans>
        </Heading>
        <Button colorScheme={'red'}>Delete your account</Button>
      </Box>
    </VStack>
  )
}
