import {
  Button,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogCloseButton
} from '@chakra-ui/react'
import React from 'react'

export function DeviceDeleteAlert({
  isOpen,
  onClose,
  logoutDevice
}: {
  onClose: () => void
  isOpen: boolean
  logoutDevice: () => void
}) {
  const cancelRef = React.useRef()

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
            Are you sure you want to logout this device?
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
              onClick={() => {
                logoutDevice()
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
