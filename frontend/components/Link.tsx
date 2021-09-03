import { LinkProps, Link as ChakraLink } from '@chakra-ui/react'

import NextLink, { LinkProps as NextLinkProps } from 'next/link'

export const Link: React.FC<LinkProps & NextLinkProps> = (props) => {
  return (
    <ChakraLink
      as={NextLink}
      data-test="Link"
      color={'blue.400'}
      tabIndex={0}
      {...props}
    />
  )
}
