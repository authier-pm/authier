import { Text, TextProps } from '@chakra-ui/react'

/**
 * just a convenience wrapper, because vscode doesn't autocomplete the chakra-ui Text component
 */
export const Txt = (props: TextProps) => {
  // @ts-expect-error
  return <Text {...props} />
}
