import {
  Box,
  Center,
  Heading,
  Stack,
  useColorModeValue,
  Image,
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  IconButton,
  useDisclosure,
  SlideFade,
  Collapse,
  Checkbox,
  VStack,
  SimpleGrid,
  FormControl,
  FormErrorMessage,
  FormLabel,
  CheckboxGroup,
  HStack,
  useCheckboxGroup
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { passwordStrength } from 'check-password-strength'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { generate } from 'generate-password'
import { PasswordGenerator } from '@src/components/vault/PasswordGenerator'

enum Value {
  'Too Weak' = 1,
  'Weak' = 2,
  'Medium' = 3,
  'Strong' = 4
}

interface Values {
  numbers: boolean
  symbols: boolean
  lowercase: boolean
  uppercase: boolean
}

const InputWithHeading = ({
  defaultValue,
  heading
}: {
  defaultValue: string
  heading: string
}) => {
  return (
    <Box flex={'50%'}>
      <Heading size="md" as="h5">
        {heading}
      </Heading>
      <Input defaultValue={defaultValue} />
    </Box>
  )
}

export const ItemSettings = ({ data }: any) => {
  let history = useHistory()
  const [show, setShow] = useState(false)
  const [password, setPassword] = useState<string>(data.password)
  const [levelOfPsw, setLevelOfPsw] = useState<string>(
    passwordStrength(data.password).value
  )

  const handleChangeOriginPassword = (event: any) => {
    setLevelOfPsw(passwordStrength(event.target.value).value)
    setPassword(event.target.value)
  }

  const { isOpen, onToggle } = useDisclosure()
  const handleClick = () => setShow(!show)

  return (
    <Center
      mt={4}
      flexDirection="column"
      boxShadow={'2xl'}
      rounded={'md'}
      overflow={'hidden'}
      w="600px"
      m="auto"
      bg={useColorModeValue('white', 'gray.900')}
    >
      <Flex p={5} flexDirection="column" w="inherit">
        <SimpleGrid row={2} columns={2} spacing="40px">
          <InputWithHeading heading="URL:" defaultValue={data.originalUrl} />
          <InputWithHeading heading="Label:" defaultValue={data.label} />

          <InputWithHeading heading="Username:" defaultValue={data.username} />
          <Box flex={'50%'}>
            <Heading size="md" as="h5">
              Password:
            </Heading>
            <Progress
              //@ts-expect-error
              value={Value[levelOfPsw]}
              size="xs"
              colorScheme="green"
              max={4}
              mb={1}
            />
            <InputGroup size="md">
              <Input
                value={password}
                onChange={handleChangeOriginPassword}
                pr="4.5rem"
                type={show ? 'text' : 'password'}
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={handleClick}>
                  {show ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
            </InputGroup>
          </Box>
        </SimpleGrid>

        <Stack direction={'row'} justifyContent="flex-end" spacing={1} my={5}>
          <Button
            colorScheme="blackAlpha"
            size="sm"
            //@ts-expect-error
            onClick={() => history.goBack()}
          >
            Cancel
          </Button>
          <Button colorScheme="twitter" size="sm">
            Save
          </Button>
        </Stack>

        <IconButton
          w="min-content"
          aria-label="Search database"
          icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          onClick={onToggle}
          m={3}
        />

        <PasswordGenerator isOpen={isOpen} />
      </Flex>
    </Center>
  )
}
