import React, { useState } from 'react'

import { useNavigation } from '@react-navigation/native'
import { AlertDialog, Button, Text, IconButton, Center } from 'native-base'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { device } from '../utils/Device'
import { useDeleteEncryptedSecretMutation } from './DeleteSecretAlert.codegen'
import { EncryptedAuthsDocument } from '../screens/PasswordVault/PasswordVault.codegen'

export const DeleteSecretAlert = ({ id }: { id: string }) => {
  const navigation = useNavigation()
  const [isOpen, setIsOpen] = useState(false)
  const [deleteEncryptedSecretMutation] = useDeleteEncryptedSecretMutation()

  const onClose = async () => {
    await deleteEncryptedSecretMutation({
      variables: {
        id: id
      },
      refetchQueries: [{ query: EncryptedAuthsDocument, variables: {} }]
    })

    await device.state?.removeSecret(id)
    navigation.goBack()
  }

  const cancelRef = React.useRef(null)
  return (
    <Center>
      <IconButton
        rounded={'2xl'}
        onPress={() => setIsOpen(!isOpen)}
        variant={'ghost'}
        _pressed={{
          backgroundColor: 'transparent'
        }}
        icon={<Ionicons name={'trash-outline'} size={30} color={'red'} />}
      />
      <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen}>
        <AlertDialog.Content>
          <AlertDialog.Header>Remove item</AlertDialog.Header>
          <AlertDialog.Body>
            <Text fontSize={16}>You cant take this back!</Text>
          </AlertDialog.Body>

          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button
                variant="unstyled"
                colorScheme="coolGray"
                onPress={() => setIsOpen(!isOpen)}
                ref={cancelRef}
              >
                Cancel
              </Button>
              <Button colorScheme="danger" onPress={() => onClose()}>
                Remove
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Center>
  )
}
