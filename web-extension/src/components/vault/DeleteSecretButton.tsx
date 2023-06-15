import { useDisclosure } from '@chakra-ui/react'
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
  children: React.ReactElement
}

export const DeleteSecretButton: React.FC<DeleteSecretButtonProps> = ({
  secrets,
  children
}) => {
  const { setSelectedItems } = useContext(DeviceStateContext)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const location = useLocation()
  const navigate = useNavigate()
  const [deleteEncryptedSecretMutation] = useDeleteEncryptedSecretMutation()
  const [removeEncryptedSecrets] = useRemoveEncryptedSecretsMutation()

  const modifiedChildren = React.cloneElement(children, {
    onClick: onOpen
  })

  return (
    <>
      {modifiedChildren}
      <DeleteAlert
        isOpen={isOpen}
        onClose={onClose}
        deleteItem={async () => {
          console.log('delete secret', secrets)
          if (secrets.length > 1) {
            console.log('delete multiple secrets')
            const input = secrets.map(({ id }) => id)
            await removeEncryptedSecrets({
              variables: {
                secrets: input
              }
            })

            device.state?.removeSecrets(input)
            setSelectedItems([])
          } else {
            await deleteEncryptedSecretMutation({
              variables: {
                id: secrets[0].id
              }
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
