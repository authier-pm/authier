import { Container, Heading } from '@chakra-ui/react'
import React from 'react'

/**
 * generic page container with a heading
 */
export const AuPage = ({ children, heading }) => {
  return (
    <>
      <Container maxW="container.xl">
        <Heading as="h1" size="lg" ml={150} my={6}>
          {heading}
        </Heading>
        {children}
      </Container>
    </>
  )
}
