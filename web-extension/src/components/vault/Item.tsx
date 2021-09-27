import {
  Avatar,
  Box,
  Center,
  Heading,
  Stack,
  Text,
  useColorModeValue,
  Image,
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'
import React from 'react'

const InputWithHeading = ({
  defaultValue,
  heading
}: {
  defaultValue: string
  heading: string
}) => {
  return (
    <Box w="inherit">
      <Heading size="md" as="h5">
        {heading}
      </Heading>
      <Input w="inherit" defaultValue={defaultValue} />
    </Box>
  )
}

export const Item = ({ data }: any) => {
  const [show, setShow] = React.useState(false)
  const handleClick = () => setShow(!show)
  console.log(data)
  return (
    <Center
      mt={4}
      flexDirection="column"
      boxShadow={'2xl'}
      rounded={'md'}
      overflow={'hidden'}
      w="800px"
      m="auto"
      bg={useColorModeValue('white', 'gray.900')}
    >
      <Flex p={5} flexDirection="column" w="inherit">
        <Flex flexDirection="row" justifyContent="space-between">
          <InputWithHeading heading="URL:" defaultValue={data.originalUrl} />
          <InputWithHeading heading="Label:" defaultValue={data.label} />
        </Flex>

        <Flex flexDirection="row" justifyContent="space-between">
          <InputWithHeading heading="Username:" defaultValue={data.username} />
          <Box w="inherit">
            <Heading size="md" as="h5">
              Password:
            </Heading>
            <InputGroup size="md">
              <Input
                w="inherit"
                pr="4.5rem"
                type={show ? 'text' : 'password'}
                defaultValue={data.password}
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={handleClick}>
                  {show ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
            </InputGroup>
          </Box>
        </Flex>

        <Stack direction={'row'} justifyContent="flex-end" spacing={1} my={5}>
          <Button colorScheme="blackAlpha" size="sm">
            Cancel
          </Button>
          <Button colorScheme="twitter" size="sm">
            Save
          </Button>
        </Stack>
      </Flex>
    </Center>
  )
}
