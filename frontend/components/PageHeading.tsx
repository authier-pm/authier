import { Heading } from '@chakra-ui/react'
import React from 'react'

export function PageHeading({ children }) {
  return (
    <Heading ml={150} mt={6}>
      {' '}
      {children}
    </Heading>
  )
}
