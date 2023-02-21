import { Button, Flex } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useFormikContext } from 'formik'

export const EditFormButtons = () => {
  const navigate = useNavigate()

  const { isSubmitting, dirty } = useFormikContext()
  return (
    <Flex
      direction={'row'}
      justifyContent="space-between"
      my={5}
      alignItems={'baseline'}
    >
      <Button
        _focus={{
          bg: 'gray.200'
        }}
        onClick={() => {
          const canGoBack = window.history.length > 1
          if (canGoBack) {
            return navigate(-1)
          } else {
            return navigate('/')
          }
        }}
      >
        Go back
      </Button>
      <Button
        disabled={isSubmitting || !dirty}
        isLoading={isSubmitting}
        type="submit"
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
        aria-label="Save"
      >
        Save
      </Button>
    </Flex>
  )
}
