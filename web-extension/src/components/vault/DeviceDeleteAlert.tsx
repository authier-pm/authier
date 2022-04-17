import { Checkbox } from '@chakra-ui/react'
import {
  Button,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Text,
  Tooltip,
  AlertDialogCloseButton
} from '@chakra-ui/react'
import { QuestionOutlineIcon } from '@chakra-ui/icons'
import React, { useRef, useState } from 'react'
import { HStack } from '@chakra-ui/react'
import {
  useRemoveDeviceMutation,
  useLogoutDeviceMutation
} from './DeviceDeleteAlert.codegen'

export function DeviceDeleteAlert({
  isOpen,
  id,
  onClose,
  refetch
}: {
  onClose: () => void
  isOpen: boolean
  id: string
  refetch: () => void
}) {
  const cancelRef = useRef()
  const [remove, setRemove] = useState(false)
  const [logoutDevice] = useLogoutDeviceMutation({
    variables: {
      id: id
    }
  })
  const [removeDevice] = useRemoveDeviceMutation({ variables: { id: id } })

  return (
    <>
      <AlertDialog
        motionPreset="slideInBottom"
        //@ts-expect-error TODO: fix this
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isOpen={isOpen}
        isCentered
      >
        <AlertDialogOverlay />

        <AlertDialogContent>
          <AlertDialogHeader>Logout confirmation</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody fontSize={20}>
            <Text>Are you sure you want to logout this device?</Text>
            <HStack>
              <Checkbox isChecked={remove} onChange={() => setRemove(!remove)}>
                Remove device from list
              </Checkbox>
              <Tooltip label="You will have to confirm login" fontSize="sm">
                <QuestionOutlineIcon />
              </Tooltip>
            </HStack>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              //@ts-expect-error TODO: fix this
              ref={cancelRef}
              onClick={onClose}
            >
              No
            </Button>
            <Button
              colorScheme="red"
              ml={3}
              onClick={async () => {
                if (remove) {
                  await removeDevice()
                } else {
                  await logoutDevice()
                }
                onClose()
                refetch()
              }}
            >
              Yes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
