import { DeleteIcon } from '@chakra-ui/icons'
import { IconButton, Tooltip, useDisclosure } from '@chakra-ui/react'
import { t, plural } from '@lingui/core/macro'
import {
  useDeleteEncryptedSecretMutation,
  useRemoveEncryptedSecretsMutation
} from '@shared/graphql/EncryptedSecrets.codegen'
import { SecretTypeUnion, device } from '@src/background/ExtensionDevice'
import { DeleteAlert } from '@src/components/vault/DeleteAlert'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'

import React, { useContext } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface DeleteSecretButtonProps {
  secrets: SecretTypeUnion[]
}

export const DeleteSecretButton: React.FC<DeleteSecretButtonProps> = ({
  secrets
}) => {
  const { setSelectedItems } = useContext(DeviceStateContext)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const location = useLocation()
  const navigate = useNavigate()
  const [deleteEncryptedSecretMutation] = useDeleteEncryptedSecretMutation()
  const [removeEncryptedSecrets] = useRemoveEncryptedSecretsMutation()

  return (
    <>
      <Tooltip
        label={plural(secrets.length, {
          one: `delete secret`,
          other: `delete # secrets`
        })}
      >
        <IconButton
          colorScheme="red"
          aria-label={plural(secrets.length, {
            one: `delete secret`,
            other: `delete # secrets`
          })}
          icon={<DeleteIcon />}
          onClick={onOpen}
        />
      </Tooltip>
      <DeleteAlert
        isOpen={isOpen}
        onClose={onClose}
        deleteItem={async () => {
          console.log('delete secret', secrets)
          if (secrets.length > 1) {
            console.log('delete multiple secrets')
            const input = secrets.map(({ id }) => id)
            await removeEncryptedSecrets({ variables: { secrets: input } })

            device.state?.removeSecrets(input)
            setSelectedItems([])
          } else {
            await deleteEncryptedSecretMutation({
              variables: { id: secrets[0].id }
            })
            await device.state?.removeSecret(secrets[0].id)

            if (location.pathname.includes(secrets[0].id)) {
              navigate('/')
            }
          }
        }}
      />
    </>
  )
}
