import { DeleteIcon } from '@chakra-ui/icons'
import { useDisclosure } from '@chakra-ui/react'
import { useDeleteEncryptedSecretMutation } from '@shared/graphql/EncryptedSecrets.codegen'
import { device } from '@src/background/ExtensionDevice'
import { DeleteAlert } from '@src/components/vault/DeleteAlert'
import { useLocation, useNavigate } from 'react-router-dom'

export const DeleteSecretButton = ({ secret }: { secret: { id: string } }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const location = useLocation()
  const navigate = useNavigate()
  const [deleteEncryptedSecretMutation] = useDeleteEncryptedSecretMutation()

  return (
    <>
      <DeleteIcon
        cursor={'pointer'}
        boxSize={26}
        padding={1.5}
        alignSelf="end"
        overflow={'visible'}
        backgroundColor={'red.400'}
        _hover={{ backgroundColor: 'red.500' }}
        right="0"
        top="inherit"
        onClick={onOpen}
      />

      <DeleteAlert
        isOpen={isOpen}
        onClose={onClose}
        deleteItem={async () => {
          await deleteEncryptedSecretMutation({
            variables: {
              id: secret.id
            }
          })
          await device.state?.removeSecret(secret.id)

          if (location.pathname.includes(secret.id)) {
            navigate('/')
          }
        }}
      />
    </>
  )
}
