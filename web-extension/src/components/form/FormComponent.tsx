import { VStack, Box, Heading } from '@chakra-ui/react'
import { ReactNode } from 'react'

export default function FormComponent({
  children,
  formHeading,
  submitButton,
  onSubmit
}: {
  children: ReactNode
  formHeading: string
  submitButton: ReactNode
  onSubmit: () => void
}) {
  return (
    <Box>
      <Heading as="h3" size="lg" mb={5}>
        {formHeading}
      </Heading>
      <form onSubmit={onSubmit}>
        <VStack spacing={4} align="flex-start">
          {children}
          {submitButton}
        </VStack>
      </form>
    </Box>
  )
}
