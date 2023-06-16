import React, { useState } from 'react'

import { useNavigation } from '@react-navigation/native'
import { AlertDialog, Button, Box, Checkbox, Text, Icon } from 'native-base'

import {
  useLogoutDeviceMutation,
  useRemoveDeviceMutation
} from '@shared/graphql/AccountDevices.codegen'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Trans } from '@lingui/macro'
import { emitter } from '@src/screens/Device/Devices'

export const LogoutDeviceAlert = ({
  selectedDeviceId,
  masterDeviceId
}: {
  selectedDeviceId: string
  masterDeviceId: string
}) => {
  const navigation = useNavigation()
  const [isOpen, setIsOpen] = useState(false)
  const [remove, setRemove] = useState(false)
  const [logoutDevice] = useLogoutDeviceMutation({
    variables: {
      id: selectedDeviceId
    }
  })
  const [removeDevice] = useRemoveDeviceMutation({
    variables: { id: selectedDeviceId }
  })

  const onClose = async (goBack: boolean) => {
    if (remove) {
      console.log('remove')
      await removeDevice()
    } else {
      await logoutDevice()
    }

    if (goBack) {
      navigation.goBack()
    }
    emitter.emit('refresh')
    setIsOpen(false)
  }

  const cancelRef = React.useRef(null)
  return (
    <Box>
      <Button
        colorScheme="danger"
        rounded={15}
        leftIcon={
          <Icon
            alignSelf={'center'}
            as={Ionicons}
            name="log-out"
            size={'md'}
            color="white"
          />
        }
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text fontWeight={'bold'}>
          <Trans>Log out</Trans>
        </Text>
      </Button>
      <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen}>
        <AlertDialog.Content>
          <AlertDialog.CloseButton onPress={() => setIsOpen(!isOpen)} />
          <AlertDialog.Header>Logout device</AlertDialog.Header>
          <AlertDialog.Body>
            <Text fontSize={16}>This will logout this device.</Text>

            {masterDeviceId !== selectedDeviceId ? (
              <Checkbox
                onChange={() => setRemove(!remove)}
                value="one"
                my={2}
                colorScheme="blue"
              >
                remove from list device
              </Checkbox>
            ) : null}
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
              <Button
                rounded={15}
                colorScheme="danger"
                onPress={() => onClose(true)}
              >
                logout
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  )
}
