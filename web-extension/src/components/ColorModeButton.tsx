import { IconButton, useColorMode } from '@chakra-ui/react'
import { FiMoon } from 'react-icons/fi'

export const ColorModeButton = () => {
  const { toggleColorMode } = useColorMode()

  return (
    <IconButton
      size="lg"
      variant="ghost"
      aria-label="change color mode"
      icon={<FiMoon />}
      onClick={async () => {
        toggleColorMode()
      }}
      mt="auto"
    />
  )
}
