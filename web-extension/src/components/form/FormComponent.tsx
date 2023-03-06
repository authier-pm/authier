import { Button, VStack, Box, useColorModeValue } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { FormState } from 'react-hook-form'

export default function FormComponent({
  children,
  onSubmit,
  formState: { isDirty, isSubmitting }
}: {
  children: ReactNode
  onSubmit: () => void
  formState: FormState<{
    lockTime?: any
    language?: any
    twoFA: boolean
    autofill: boolean
  }>
}) {
  console.log(isSubmitting)
  return (
    <VStack
      width={'70%'}
      maxW="600px"
      alignItems={'normal'}
      spacing={20}
      rounded={'lg'}
      boxShadow={'lg'}
      p={30}
      bg={useColorModeValue('white', 'gray.800')}
    >
      <Box textAlign="start">
        <form onSubmit={onSubmit}>
          <VStack spacing={4} align="flex-start">
            {children}
            <Button
              alignSelf={'center'}
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
              <Trans>Save</Trans>
            </Button>
          </VStack>
        </form>
      </Box>
    </VStack>
  )
}
