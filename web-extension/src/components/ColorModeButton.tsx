import { FiMoon } from 'react-icons/fi'
import { useThemeMode } from '@src/ExtensionProviders'
import { Button } from '@src/components/ui/button'

export const ColorModeButton = () => {
  const { toggleColorMode } = useThemeMode()

  return (
    <Button
      aria-label="change color mode"
      className="mt-auto"
      size="icon"
      variant="ghost"
      onClick={() => {
        toggleColorMode()
      }}
    >
      <FiMoon className="size-4" />
    </Button>
  )
}
