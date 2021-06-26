import React, { ReactElement } from 'react'
import {
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'

export default function Register(): ReactElement {
  const [show, setShow] = React.useState(false)
  const handleClick = () => setShow(!show)

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

      <Button colorScheme="teal" size="sm">
        Log in
      </Button>
    </Flex>
  )
}
