import { AlertDialog, Button, Box, Text, Icon } from 'native-base'
import React, { useState } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'

export const ButtonWithAlert = ({
  icon,
  text,
  onPress,
  btnColor,
  btnText
}: {
  icon: string
  text: string
  onPress: () => void
  btnColor: string
  btnText: string
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const cancelRef = React.useRef(null)
  return (
    <Box alignItems="center">
      <Button
        w="90%"
        leftIcon={<Icon as={Ionicons} name={icon} size={5} />}
        colorScheme={btnColor}
        onPress={() => setIsOpen(!isOpen)}
      >
        {btnText}
      </Button>
      <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen}>
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Are you sure?</AlertDialog.Header>
          <AlertDialog.Body>
            <Text fontSize={16}>{text}</Text>
          </AlertDialog.Body>

          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button colorScheme="danger" onPress={async () => onPress()}>
                Yes
              </Button>
              <Button
                variant="unstyled"
                colorScheme="coolGray"
                onPress={() => setIsOpen(!isOpen)}
                ref={cancelRef}
              >
                No
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  )
}
