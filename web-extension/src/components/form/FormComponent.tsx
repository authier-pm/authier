import { Button, VStack, Box, Heading } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

export default function FormComponent({
  children,
  onSubmit,
  isDirty,
  isSubmitting,
  formHeading
}: {
  children: ReactNode
  onSubmit: () => void
  isDirty: boolean
  isSubmitting: boolean
  formHeading: string
}) {
  return (
    <Box>
      <Heading as="h3" size="lg" mb={5}>
        {formHeading}
      </Heading>
      <form onSubmit={onSubmit}>
        <VStack spacing={4} align="flex-start">
          {children}
          <Button
            mt={4}
            bg={'blue.400'}
            color={'white'}
            boxShadow={
              '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
            }
            _hover={{
              bg: 'blue.500'
            }}
            _focus={{
              bg: 'blue.500'
            }}
            aria-label="Submit"
            type="submit"
            onSubmit={onSubmit}
            isDisabled={isSubmitting || !isDirty}
            isLoading={isSubmitting}
          >
            <Trans>Submit</Trans>
          </Button>
        </VStack>
      </form>
    </Box>
  )
}
