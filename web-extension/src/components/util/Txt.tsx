import { Text, TextProps } from '@chakra-ui/react'

/**
 * just a convenience wrapper, because vscode doesn't autocomplete the chakra-ui Text component
 */
export const Txt = (props: TextProps) => {
  return <Text {...props} />
}

export const TxtNowrap = (props: TextProps) => {
  return <Txt {...props} whiteSpace={'nowrap'} />
}
