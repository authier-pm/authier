import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Checkbox,
  Text,
  Tooltip,
  HStack
} from '@src/components/ui/legacy'
import { useRef, useState } from 'react'
import {
  useRemoveDeviceMutation,
  useLogoutDeviceMutation
} from '@shared/graphql/AccountDevices.codegen'
import { useDevicesListWithDataQuery } from '@src/pages-vault/Devices.codegen'
import { QuestionOutlineIcon } from '@src/components/ui/icons'

export function DeviceDeleteAlert({
  isOpen,
  id,
  onClose
}: {
  onClose: () => void
  isOpen: boolean
  id: string
}) {
  const { refetch: devicesRefetch } = useDevicesListWithDataQuery()
  const cancelRef = useRef<HTMLButtonElement>(null!)
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
            <Button ref={cancelRef} onClick={onClose}>
              No
            </Button>
            <Button
              colorScheme="red"
              ml={3}
              onClick={async () => {
                if (remove) {
                  await removeDevice({ variables: { id } })
                } else {
                  await logoutDevice({ variables: { id } })
                }
                onClose()
                devicesRefetch()
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
