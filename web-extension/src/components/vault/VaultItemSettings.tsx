import {
  useColorModeValue,
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  IconButton,
  useDisclosure,
  Spinner,
  Alert,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Tooltip,
  Box,
  useToast,
  Center,
  Heading,
  List,
  ListItem,
  Link
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { passwordStrength } from 'check-password-strength'
import { ChevronDownIcon, ChevronUpIcon, CloseIcon } from '@chakra-ui/icons'
import { PasswordGenerator } from '@src/components/vault/PasswordGenerator'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { device } from '@src/background/ExtensionDevice'
import { useUpdateEncryptedSecretMutation } from '@shared/graphql/EncryptedSecrets.codegen'
import { Field, Formik, FormikHelpers } from 'formik'
import { Trans, t } from '@lingui/macro'
import { motion } from 'framer-motion'
import {
  TOTPSchema,
  totpValues,
  credentialValues
} from '@shared/formikSharedTypes'
import { EditFormButtons } from './EditFormButtons'
import { IoDuplicateOutline } from 'react-icons/io5'
import { getWebInputsForUrl } from '@src/background/getWebInputsForUrl'
import { useRemoveWebInputMutation } from './VaultItemSettings.codegen'

const TOTPSecret = (secretProps: ITOTPSecret) => {
  const { totp } = secretProps
  const navigate = useNavigate()

  const [updateSecret] = useUpdateEncryptedSecretMutation()
  const [show, setShow] = useState(false)

  const bg = useColorModeValue('cyan.800', 'gray.800')

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        width: '80%',
        display: 'contents'
      }}
    >
      <Center className='wrapper' height={'100vh'}>
        <Flex
          width={{ base: '90%', sm: '70%', md: '60%' }}
          mt={4}
          flexDirection="column"
          boxShadow={'2xl'}
          rounded={'md'}
          overflow={'hidden'}
          m="auto"
          alignItems={'center'}
          bg={bg}
        >
          <CloseIcon
            cursor={'pointer'}
            boxSize={26}
            padding={1.5}
            alignSelf="end"
            overflow={'visible'}
            _hover={{ backgroundColor: 'yellow.500' }}
            right="0"
            top="inherit"
            onClick={() => {
              const canGoBack = window.history.length > 1
              if (canGoBack) {
                return navigate(-1)
              } else {
                return navigate('/')
              }
            }}
          />
          <Formik
            initialValues={{
              secret: totp.secret,
              url: totp.url!,
              label: totp.label,
              digits: totp.digits,
              period: totp.period
            }}
            validationSchema={TOTPSchema}
            onSubmit={async (
              values: totpValues,
              { setSubmitting }: FormikHelpers<totpValues>
            ) => {
              const secret = device.state?.secrets.find(
                ({ id }) => id === secretProps.id
              )

              if (secret && device.state) {
                secret.encrypted = await device.state.encrypt(
                  JSON.stringify({
                    ...values,
                    iconUrl: '',
                    digits: 6,
                    period: 30
                  })
                )

                await updateSecret({
                  variables: {
                    id: secret.id,
                    patch: {
                      encrypted: secret.encrypted,
                      kind: secret.kind
                    }
                  }
                })

                await device.state?.save()
                setSubmitting(false)
              }
            }}
          >
            {({ handleSubmit, errors, touched }) => (
              <Box width={'80%'} mt={5}>
                <form onSubmit={handleSubmit}>
                  <Flex flexDirection="column">
                    <FormControl isInvalid={!!errors.url && touched.url}>
                      <FormLabel htmlFor="url">URL:</FormLabel>
                      <Field as={Input} id="url" name="url" />
                      <FormErrorMessage>{errors.url}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.label && touched.label}>
                      <FormLabel htmlFor="label">Label:</FormLabel>
                      <Field as={Input} id="label" name="label" />
                      <FormErrorMessage>{errors.label}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.secret && touched.secret}>
                      <FormLabel htmlFor="secret">Secret:</FormLabel>
                      <InputGroup size="md">
                        <Field
                          id="secret"
                          pr="4.5rem"
                          type={show ? 'text' : 'password'}
                          as={Input}
                          name="secret"
                        />
                        <InputRightElement width="4.5rem">
                          <Button
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShow(!show)}
                          >
                            {show ? 'Hide' : 'Show'}
                          </Button>
                        </InputRightElement>
                      </InputGroup>

                      <FormErrorMessage>{errors.secret}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.digits && touched.digits}>
                      <FormLabel htmlFor="digits">Digits:</FormLabel>
                      <Field as={Input} id="digits" name="digits" />
                      <FormErrorMessage>{errors.digits}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.period && touched.period}>
                      <FormLabel htmlFor="period">Period:</FormLabel>
                      <Field as={Input} id="period" name="period" />
                      <FormErrorMessage>{errors.period}</FormErrorMessage>
                    </FormControl>

                    <EditFormButtons secret={secretProps} />
                  </Flex>
                </form>
              </Box>
            )}
          </Formik>
        </Flex>
      </Center>
    </motion.div>
  )
}

const LoginSecret = (secretProps: ILoginSecret) => {
  const [show, setShow] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const { isOpen, onToggle } = useDisclosure()
  const handleClick = () => setShow(!show)
  const [initPassword, setInitPassword] = useState('')

  const [updateSecret] = useUpdateEncryptedSecretMutation()
  const webInputs = getWebInputsForUrl(secretProps.loginCredentials.url)
  const [removeWebInput] = useRemoveWebInputMutation()

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        width: '80%',
        display: 'contents'
      }}
    >
      <Center className='wrapper' height={'100vh'}>

        <Flex
          width={{ base: '90%', sm: '70%', md: '60%' }}
          mt={4}
          flexDirection="column"
          boxShadow={'2xl'}
          rounded={'md'}
          overflow={'hidden'}
          m="auto"
          alignItems={'center'}
          bg={useColorModeValue('cyan.800', 'gray.800')}
        >
          <CloseIcon
            cursor={'pointer'}
            boxSize={26}
            padding={1.5}
            alignSelf="end"
            overflow={'visible'}
            _hover={{ backgroundColor: 'yellow.500' }}
            right="0"
            top="inherit"
            onClick={() => {
              const canGoBack = window.history.length > 1
              if (canGoBack) {
                return navigate(-1)
              } else {
                return navigate('/')
              }
            }}
          />

          <Formik
            enableReinitialize
            initialValues={{
              url: secretProps.loginCredentials.url,
              password:
                initPassword === ''
                  ? secretProps.loginCredentials.password
                  : initPassword,
              label: secretProps.loginCredentials.label,
              username: secretProps.loginCredentials.username
            }}
            onSubmit={async (
              values: credentialValues,
              { setSubmitting }: FormikHelpers<credentialValues>
            ) => {
              const secret = device.state?.secrets.find(
                ({ id }) => id === secretProps.id
              )
              if (secret && device.state) {
                secret.encrypted = await device.state.encrypt(
                  JSON.stringify({
                    password: values.password,
                    username: values.username,
                    url: values.url,
                    label: values.label,
                    iconUrl: null
                  })
                )

                await updateSecret({
                  variables: {
                    id: secretProps.id,
                    patch: {
                      encrypted: secret.encrypted,
                      kind: secretProps.kind
                    }
                  }
                })

                await device.state?.save()
                setSubmitting(false)
              }
            }}
          >
            {({ values, handleSubmit, errors, touched }) => {
              const levelOfPsw = passwordStrength(values.password)
              return (
                <Box w={'80%'}>
                  <form onSubmit={handleSubmit}>
                    <Flex mt={3} flexDirection="column">
                      <FormControl isInvalid={!!errors.url && touched.url}>
                        <FormLabel htmlFor="url">URL:</FormLabel>
                        <Field as={Input} id="url" name="url" />
                        <FormErrorMessage>{errors.url}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.label && touched.label}>
                        <FormLabel htmlFor="label">Label:</FormLabel>
                        <Field as={Input} id="label" name="label" />
                        <FormErrorMessage>{errors.label}</FormErrorMessage>
                      </FormControl>

                      <FormControl
                        isInvalid={!!errors.username && touched.username}
                      >
                        <FormLabel htmlFor="username">Username:</FormLabel>
                        <Field as={Input} id="username" name="username" />
                        <FormErrorMessage>{errors.username}</FormErrorMessage>
                      </FormControl>

                      <FormControl
                        isInvalid={!!errors.password && touched.password}
                      >
                        <FormLabel htmlFor="password">Password:</FormLabel>
                        <Flex>
                          <InputGroup size="md">
                            <Field
                              as={Input}
                              id="password"
                              name="password"
                              pr="4.5rem"
                              type={show ? 'text' : 'password'}
                            />
                            <InputRightElement width="4.5rem">
                              <Button h="1.75rem" size="sm" onClick={handleClick}>
                                {show ? 'Hide' : 'Show'}
                              </Button>
                            </InputRightElement>
                          </InputGroup>
                          <Tooltip label={t`copy password`}>
                            <IconButton
                              ml={2}
                              icon={<IoDuplicateOutline />}
                              aria-label={`copy password`}
                              onClick={() => {
                                navigator.clipboard.writeText(values.password)
                                toast({
                                  title: t`Copied to clipboard`,
                                  status: 'success'
                                })
                              }}
                            ></IconButton>
                          </Tooltip>
                        </Flex>

                        <Progress
                          value={levelOfPsw.id}
                          size="xs"
                          colorScheme="green"
                          max={3}
                          min={0}
                          mb={1}
                        />

                        <FormErrorMessage>{errors.password}</FormErrorMessage>
                      </FormControl>

                      {secretProps.loginCredentials.parseError && (
                        <Alert status="error" mt={4}>
                          <Trans>Failed to parse this secret:</Trans>
                          {JSON.stringify(
                            secretProps.loginCredentials.parseError
                          )}
                        </Alert>
                      )}
                      <Tooltip label="Password generator">
                        <IconButton
                          w="min-content"
                          aria-label="Open password generator"
                          icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          onClick={onToggle}
                          m={3}
                        />
                      </Tooltip>
                      <PasswordGenerator
                        isOpen={isOpen}
                        onGenerate={setInitPassword}
                      />
                      <EditFormButtons secret={secretProps} />
                    </Flex>
                  </form>
                  <Box>
                    <Heading size="md" mt={5}>
                      {t`Matching Web inputs`}
                    </Heading>

                    <List spacing={3} mt={3} mb={6} bgColor={'gray.500'} p={3} rounded={'md'}>
                      {webInputs.map(
                        ({ kind, domPath, url, id }) => (
                          <ListItem key={id}>
                            {kind} - {domPath} - <Button onClick={async () => {
                              await removeWebInput({ variables: { id } })
                              toast(
                                {
                                  title: t`Web input removed`,
                                  status: 'success'
                                }
                              )
                              // TODO reload all web inputs for this URL
                            }}>
                              <Trans>
                                Remove
                              </Trans>
                            </Button>
                          </ListItem>
                        )
                      )}
                      {
                        webInputs.length === 0 && <ListItem>{t`No matching web inputs found`}</ListItem>
                      }
                    </List>
                  </Box>
                </Box>
              )
            }}
          </Formik>
        </Flex>
      </Center>

    </motion.div>
  )
}

export const VaultItemSettings = () => {
  const [secret, setSecret] = useState<
    ITOTPSecret | ILoginSecret | undefined | null
  >(null)
  const params = useParams()

  useEffect(() => {
    async function loadSecret() {
      const secret = await device.state?.getSecretDecryptedById(
        params.secretId as string
      )
      setSecret(secret)
    }
    loadSecret()
  }, [])

  if (!device.state && !secret) {
    return <Spinner />
  }

  if (!secret) {
    return <Alert>Could not find this secret, it may be deleted</Alert>
  }

  console.log('secret', secret)
  if (secret.kind === 'TOTP') {
    return <TOTPSecret {...secret} />
  } else if (secret.kind === 'LOGIN_CREDENTIALS') {
    return <LoginSecret {...secret} />
  }

  return null
}
