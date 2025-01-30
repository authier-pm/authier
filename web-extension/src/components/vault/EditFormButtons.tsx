import {
  Button,
  Flex,
  HStack,
  IconButton,
  Tooltip,
  useToast
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useFormikContext } from 'formik'

import { DeleteSecretButton } from './DeleteSecretButton'
import { SecretTypeUnion } from '@src/background/ExtensionDevice'
import { IoDuplicate } from 'react-icons/io5'
import { t } from '@lingui/macro'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'

export const EditFormButtons = ({ secret }: { secret?: SecretTypeUnion }) => {
  const navigate = useNavigate()
  const toast = useToast()

  const { isSubmitting, dirty } = useFormikContext()

  return (
    <Flex
      direction={'row'}
      justifyContent="space-between"
      my={5}
      alignItems={'baseline'}
    >
      <Button
        _focus={{
          bg: 'gray.200'
        }}
        onClick={() => {
          const canGoBack = window.history.length > 1
          if (canGoBack) {
            return navigate(-1)
          } else {
            return navigate('/')
          }
        }}
      >
        Go back
      </Button>
      {secret && (
        <HStack spacing={10}>
          <DeleteSecretButton secrets={[secret]}></DeleteSecretButton>

          <Tooltip label={t`copy whole secret`}>
            <IconButton
              onClick={() => {
                let stringified
                if (secret.kind === EncryptedSecretType.TOTP) {
                  stringified = JSON.stringify(secret.totp)
                } else {
                  stringified = `url: ${secret.loginCredentials.url}\nlabel: ${secret.loginCredentials.label}\nusername: ${secret.loginCredentials.username}\npassword: ${secret.loginCredentials.password}`
                }

                navigator.clipboard.writeText(stringified)
                toast({
                  title: t`Copied to clipboard`,
                  status: 'success'
                })
              }}
              aria-label={t`copy whole secret`}
              icon={<IoDuplicate></IoDuplicate>}
            ></IconButton>
          </Tooltip>
        </HStack>
      )}

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
    </Flex>
  )
}
