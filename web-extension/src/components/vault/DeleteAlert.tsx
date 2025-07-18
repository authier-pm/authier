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

export function DeleteAlert({
  isOpen,
  onClose,
  deleteItem
}: {
  onClose: () => void
  isOpen: boolean
  deleteItem: () => void
}) {
  const cancelRef = React.useRef(null)

  return (
    <>
      <AlertDialog
        motionPreset="slideInBottom"
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isOpen={isOpen}
        isCentered
      >
        <AlertDialogOverlay />

        <AlertDialogContent>
          <AlertDialogHeader>Delete confirmation</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody fontSize={20}>
            Are you sure you want to delete this item?
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              No
            </Button>
            <Button
              colorScheme="red"
              ml={3}
              onClick={() => {
                onClose()
                deleteItem()
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
