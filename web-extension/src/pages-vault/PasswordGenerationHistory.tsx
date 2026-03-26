import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useToast
} from '@src/components/ui/legacy'
import { Field, Formik, FormikHelpers } from 'formik'
import { useContext, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { PasswordSchema, credentialValues } from '@shared/formikSharedTypes'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { device } from '@src/background/ExtensionDevice'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { loginCredentialsSchema } from '@shared/loginCredentialsSchema'
import {
  clearGeneratedPasswordHistory,
  GENERATED_PASSWORD_HISTORY_STORAGE_KEY,
  getGeneratedPasswordHistory,
  GeneratedPasswordHistoryEntry,
  normalizeHistoryHostname
} from '@src/util/generatedPasswordHistory'

const emptyCredentialValues: credentialValues = {
  label: '',
  password: '',
  url: '',
  username: ''
}

const getInitialValuesForEntry = (
  entry: GeneratedPasswordHistoryEntry | null
): credentialValues => {
  if (!entry) {
    return emptyCredentialValues
  }

  return {
    label: entry.hostname,
    password: entry.password,
    url: entry.hostname,
    username: ''
  }
}

export const PasswordGenerationHistory = () => {
  const { loginCredentials } = useContext(DeviceStateContext)
  const [history, setHistory] = useState<GeneratedPasswordHistoryEntry[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [revealedEntryIds, setRevealedEntryIds] = useState<string[]>([])
  const [selectedEntry, setSelectedEntry] =
    useState<GeneratedPasswordHistoryEntry | null>(null)
  const toast = useToast()

  const panelBg = useColorModeValue('cyan.800', 'gray.800')
  const itemBg = useColorModeValue('whiteAlpha.300', 'whiteAlpha.100')

  useEffect(() => {
    let isDisposed = false

    const syncHistory = async () => {
      const nextHistory = await getGeneratedPasswordHistory()
      if (isDisposed) {
        return
      }

      setHistory(nextHistory)
      setHistoryLoaded(true)
    }

    const onStorageChange = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (
        areaName === 'local' &&
        changes[GENERATED_PASSWORD_HISTORY_STORAGE_KEY]
      ) {
        void syncHistory()
      }
    }

    void syncHistory()
    browser.storage.onChanged.addListener(onStorageChange)

    return () => {
      isDisposed = true
      browser.storage.onChanged.removeListener(onStorageChange)
    }
  }, [])

  const isEntrySaved = (entry: GeneratedPasswordHistoryEntry) => {
    return loginCredentials.some(({ loginCredentials: secret }) => {
      return (
        normalizeHistoryHostname(secret.url) === entry.hostname &&
        secret.password === entry.password
      )
    })
  }

  const togglePasswordVisibility = (entryId: string) => {
    setRevealedEntryIds((current) => {
      if (current.includes(entryId)) {
        return current.filter((id) => id !== entryId)
      }

      return [...current, entryId]
    })
  }

  const copyPassword = async (password: string) => {
    await navigator.clipboard.writeText(password)
    toast({
      title: 'Password copied',
      status: 'success'
    })
  }

  const clearHistory = async () => {
    const shouldClear = window.confirm(
      'Clear password generation history? This cannot be undone.'
    )
    if (!shouldClear) {
      return
    }

    await clearGeneratedPasswordHistory()
    setHistory([])
    setSelectedEntry(null)
    setRevealedEntryIds([])
    toast({
      title: 'Password generation history cleared',
      status: 'success'
    })
  }

  if (!historyLoaded) {
    return <Spinner />
  }

  return (
    <Box p={6}>
      <Flex
        alignItems="center"
        bg={panelBg}
        borderRadius="lg"
        justifyContent="space-between"
        mb={6}
        p={5}
      >
        <Box>
          <Heading size="md">Password generation history</Heading>
          <Text mt={2}>
            Generated passwords are kept locally so they can still be recovered
            after fast redirects or form submission.
          </Text>
        </Box>
        <Button
          colorScheme="red"
          isDisabled={history.length === 0}
          onClick={() => {
            void clearHistory()
          }}
        >
          Clear history
        </Button>
      </Flex>

      {history.length === 0 ? (
        <Box bg={panelBg} borderRadius="lg" p={6}>
          <Text>No generated passwords have been recorded yet.</Text>
        </Box>
      ) : (
        <Stack spacing={4}>
          {history.map((entry) => {
            const isSaved = isEntrySaved(entry)
            const isRevealed = revealedEntryIds.includes(entry.id)

            return (
              <Box
                bg={itemBg}
                borderRadius="lg"
                key={entry.id}
                p={5}
                shadow="md"
              >
                <Flex
                  alignItems={{ base: 'start', md: 'center' }}
                  direction={{ base: 'column', md: 'row' }}
                  gap={3}
                  justifyContent="space-between"
                  mb={4}
                >
                  <Box>
                    <Heading size="sm">{entry.hostname}</Heading>
                    <Text fontSize="sm" mt={1}>
                      {new Date(entry.createdAt).toLocaleString()}
                    </Text>
                  </Box>
                  {isSaved ? (
                    <Badge colorScheme="green" fontSize="0.9em" px={3} py={1}>
                      Saved
                    </Badge>
                  ) : (
                    <Button
                      colorScheme="blue"
                      onClick={() => {
                        setSelectedEntry(entry)
                      }}
                    >
                      Save
                    </Button>
                  )}
                </Flex>

                <Text fontSize="sm" mb={2}>
                  URL
                </Text>
                <Text mb={4} wordBreak="break-all">
                  {entry.pageUrl}
                </Text>

                <Text fontSize="sm" mb={2}>
                  Password
                </Text>
                <Flex
                  alignItems={{ base: 'stretch', md: 'center' }}
                  direction={{ base: 'column', md: 'row' }}
                  gap={3}
                >
                  <Input
                    isReadOnly
                    type={isRevealed ? 'text' : 'password'}
                    value={entry.password}
                  />
                  <Flex gap={3}>
                    <Button
                      onClick={() => {
                        togglePasswordVisibility(entry.id)
                      }}
                    >
                      {isRevealed ? 'Hide' : 'Reveal'}
                    </Button>
                    <Button
                      onClick={() => {
                        void copyPassword(entry.password)
                      }}
                    >
                      Copy
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            )
          })}
        </Stack>
      )}

      <Modal
        isOpen={selectedEntry !== null}
        onClose={() => {
          setSelectedEntry(null)
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <Formik
            enableReinitialize
            initialValues={getInitialValuesForEntry(selectedEntry)}
            validationSchema={PasswordSchema}
            onSubmit={async (
              values: credentialValues,
              { setSubmitting, resetForm }: FormikHelpers<credentialValues>
            ) => {
              if (!device.state) {
                setSubmitting(false)
                return
              }

              const loginCredentials = {
                password: values.password,
                username: values.username,
                url: values.url,
                label: values.label,
                iconUrl: null
              }

              loginCredentialsSchema.parse(loginCredentials)

              await device.state.addSecrets([
                {
                  kind: EncryptedSecretType.LOGIN_CREDENTIALS,
                  loginCredentials,
                  encrypted: await device.state.encrypt(
                    JSON.stringify(loginCredentials)
                  ),
                  createdAt: new Date().toJSON()
                }
              ])

              setSubmitting(false)
              resetForm()
              setSelectedEntry(null)
              toast({
                title: 'Credential saved',
                status: 'success'
              })
            }}
          >
            {({ handleSubmit, errors, isSubmitting, touched }) => (
              <form onSubmit={handleSubmit}>
                <ModalHeader>Save generated password</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Stack spacing={4}>
                    <FormControl isInvalid={!!errors.url && touched.url}>
                      <FormLabel htmlFor="url">URL</FormLabel>
                      <Field as={Input} id="url" name="url" />
                      <FormErrorMessage>{errors.url}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.label && touched.label}>
                      <FormLabel htmlFor="label">Label</FormLabel>
                      <Field as={Input} id="label" name="label" />
                      <FormErrorMessage>{errors.label}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={!!errors.username && touched.username}
                    >
                      <FormLabel htmlFor="username">Username</FormLabel>
                      <Field as={Input} id="username" name="username" />
                      <FormErrorMessage>{errors.username}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={!!errors.password && touched.password}
                    >
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <Field as={Input} id="password" name="password" />
                      <FormErrorMessage>{errors.password}</FormErrorMessage>
                    </FormControl>
                  </Stack>
                </ModalBody>

                <ModalFooter gap={3}>
                  <Button
                    onClick={() => {
                      setSelectedEntry(null)
                    }}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    isLoading={isSubmitting}
                    type="submit"
                  >
                    Save credential
                  </Button>
                </ModalFooter>
              </form>
            )}
          </Formik>
        </ModalContent>
      </Modal>
    </Box>
  )
}
