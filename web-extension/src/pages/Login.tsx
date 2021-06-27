import React, { ReactElement } from 'react'
import {
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Box,
  Text
} from '@chakra-ui/react'
import { useLoginMutation } from './Login.codegen'

export default function Login(): ReactElement {
  const [show, setShow] = React.useState(false)
  const handleClick = () => setShow(!show)
  const [login, { data, loading, error }] = useLoginMutation()

  if (loading || !data) {
    return (
      <Box>
        <Text>Loading</Text>
      </Box>
    )
  }

  return (
    <Flex flexDirection="column" m={5}>
      <Input placeholder="Email" />
      <InputGroup size="md">
        <Input
          pr="4.5rem"
          type={show ? 'text' : 'password'}
          placeholder="Enter password"
        />
        <InputRightElement width="4.5rem">
          <Button h="1.75rem" size="sm" onClick={handleClick}>
            {show ? 'Hide' : 'Show'}
          </Button>
        </InputRightElement>
      </InputGroup>

      <Button colorScheme="teal" size="sm" onClick={() => {}}>
        Log in
      </Button>
    </Flex>
  )
}
