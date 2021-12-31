import {
  Box,
  Center,
  Heading,
  Stack,
  useColorModeValue,
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  IconButton,
  useDisclosure,
  SimpleGrid
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { passwordStrength } from 'check-password-strength'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { PasswordGenerator } from '@src/components/vault/PasswordGenerator'
import { ILoginSecret, ITOTPSecret } from '@src/util/useBackgroundState'

enum Value {
  'Tooweak' = 1,
  'Weak' = 2,
  'Medium' = 3,
  'Strong' = 4
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

const TOTPSecret = (data: ITOTPSecret) => {
  let history = useHistory()
  const [secret, setSecret] = useState<string>(data.totp)
  const [show, setShow] = useState(false)
  const handleChangeSecret = (event: any) => {
    setSecret(event.target.value)
  }
  const handleClick = () => setShow(!show)

  return (
    <Center
      mt={4}
      flexDirection="column"
      boxShadow={'2xl'}
      rounded={'md'}
      overflow={'hidden'}
      w={['400px', '600px']}
      minW={'420px'}
      m="auto"
      bg={useColorModeValue('white', 'gray.900')}
    >
      <Flex p={5} flexDirection="column" w="inherit">
        <SimpleGrid row={2} columns={2} spacing="40px">
          <InputWithHeading heading="URL:" defaultValue={data.url} />
          <InputWithHeading heading="Label:" defaultValue={data.label} />

          <Box flex={'50%'}>
            <Heading size="md" as="h5">
              Secret:
            </Heading>

            <InputGroup size="md">
              <Input
                value={secret}
                onChange={handleChangeSecret}
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
            onClick={() => history.goBack()}
          >
            Go back
          </Button>
          <Button colorScheme="twitter" size="sm">
            Save
          </Button>
        </Stack>
      </Flex>
    </Center>
  )
}

const LoginSecret = (data: ILoginSecret) => {
  let history = useHistory()
  const [show, setShow] = useState(false)
  const [password, setPassword] = useState<string>(
    data.loginCredentials.password
  )
  const [levelOfPsw, setLevelOfPsw] = useState<string>(
    passwordStrength(data.loginCredentials.password).value.split(' ').join('')
  )

  const { isOpen, onToggle } = useDisclosure()
  const handleClick = () => setShow(!show)

  const handleChangeOriginPassword = (event: any) => {
    setLevelOfPsw(
      passwordStrength(event.target.value).value.split(' ').join('')
    )
    setPassword(event.target.value)
  }

  return (
    <Center
      mt={4}
      flexDirection="column"
      boxShadow={'2xl'}
      rounded={'md'}
      overflow={'hidden'}
      w={['400px', '600px']}
      minW={'420px'}
      m="auto"
      bg={useColorModeValue('white', 'gray.900')}
    >
      <Flex p={5} flexDirection="column" w="inherit">
        <SimpleGrid row={2} columns={2} spacing="40px">
          <InputWithHeading heading="URL:" defaultValue={data.url} />
          <InputWithHeading heading="Label:" defaultValue={data.label} />

          <>
            <InputWithHeading
              heading="Username:"
              defaultValue={data.loginCredentials.username}
            />
            <Box flex={'50%'}>
              <Heading size="md" as="h5">
                Password:
              </Heading>
              <Progress
                value={Value[levelOfPsw]}
                size="xs"
                colorScheme="green"
                max={4}
                mb={1}
                defaultValue={0}
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
          </>
        </SimpleGrid>

        <Stack direction={'row'} justifyContent="flex-end" spacing={1} my={5}>
          <Button
            colorScheme="blackAlpha"
            size="sm"
            onClick={() => history.goBack()}
          >
            Go back
          </Button>
          <Button colorScheme="twitter" size="sm">
            Save
          </Button>
        </Stack>

        <>
          <IconButton
            w="min-content"
            aria-label="Search database"
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={onToggle}
            m={3}
          />
          <PasswordGenerator isOpen={isOpen} />
        </>
      </Flex>
    </Center>
  )
}

export const ItemSettings = (data: ILoginSecret | ITOTPSecret) => {
  if (data.kind === 'TOTP') {
    return <TOTPSecret {...data} />
  } else {
    return <LoginSecret {...data} />
  }
}
