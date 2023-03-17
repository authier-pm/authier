import { Box, Heading, VStack } from 'native-base'
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
      <Heading size="lg" mb={5}>
        {formHeading}
      </Heading>
      <form onSubmit={onSubmit}>
        <VStack space={4} alignItems="flex-start">
          {children}
          {submitButton}
        </VStack>
      </form>
    </Box>
  )
}
