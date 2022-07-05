import { SettingsIcon } from '@chakra-ui/icons'
import {
  Heading,
  Box,
  Center,
  Text,
  Stack,
  Badge,
  useColorModeValue,
  IconButton,
  Flex,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  FormControl,
  FormLabel,
  Checkbox,
  Select,
  Button,
  Tooltip,
  Alert,
  useDisclosure,
  VStack,
  Grid,
  Stat,
  FormHelperText
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { NbSp } from '@src/components/util/NbSp'
import { useMyDevicesQuery } from '@src/pages/Devices.codegen'
import { Formik, FormikHelpers, Field, FieldProps } from 'formik'
import React, { useEffect, useState } from 'react'
import { FiLogOut, FiSettings } from 'react-icons/fi'
import {
  useApproveChallengeMutation,
  useDevicesPageQuery,
  useRejectChallengeMutation
} from './Devices.codegen'
import { formatDistance, formatRelative, intlFormat } from 'date-fns'
import { DeviceDeleteAlert } from '@src/components/vault/DeviceDeleteAlert'
import { device } from '@src/background/ExtensionDevice'
import { RefreshDeviceButton } from '@src/components/RefreshDeviceButton'
import { useNavigate } from 'react-router-dom'

interface SettingsValues {
  lockTime: number
  twoFA: boolean
  autofill: boolean
  language: string
}

const DeviceListItem = (item: {
  id: string
  firstIpAddress: string
  lastIpAddress: string
  name: string
  lastGeoLocation: string
  createdAt: string
  logoutAt?: string | null | undefined
  masterId: string
  refetch: () => void
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()

  return (
    <>
      <Flex py={6} m={5}>
        <Box
          maxW={'380px'}
          w={'full'}
          bg={useColorModeValue('white', 'gray.900')}
          boxShadow={'2xl'}
          rounded={'lg'}
          p={6}
        >
          <Stack
            justifyContent="space-between"
            direction={'row'}
            spacing={3}
            alignItems={'baseline'}
            lineHeight={'6'}
          >
            <Box>
              {item.id === device.id && (
                <Badge height="min-content" colorScheme="yellow">
                  Current
                </Badge>
              )}
              {item.id === item.masterId && (
                <Badge height="min-content" colorScheme="purple">
                  Master
                </Badge>
              )}
              {item.logoutAt ? (
                <Badge height="min-content" colorScheme="red">
                  <Trans>Logged out</Trans>
                </Badge>
              ) : (
                <Badge height="min-content" colorScheme="green">
                  <Trans>Logged in</Trans>
                </Badge>
              )}
            </Box>

            <Menu>
              <MenuButton
                as={IconButton}
                size="xs"
                variant="unstyled"
                aria-label="Favourite"
                fontSize="15px"
                icon={
                  <SettingsIcon
                    color={useColorModeValue('gray.100', 'gray.800')}
                  />
                }
              />
              <MenuList>
                <MenuItem onClick={() => onOpen()}>
                  <FiLogOut></FiLogOut>
                  <NbSp />
                  <Trans>Logout</Trans>
                </MenuItem>
                <DeviceDeleteAlert
                  id={item.id}
                  isOpen={isOpen}
                  onClose={onClose}
                  refetch={item.refetch}
                />
                <MenuItem
                  onClick={() => {
                    if (item.id === device.id) {
                      navigate('/settings/security')
                    } else {
                      setIsConfigOpen(!isConfigOpen)
                    }
                  }}
                >
                  <FiSettings />
                  <NbSp />
                  <Trans>Config</Trans>
                </MenuItem>
              </MenuList>
            </Menu>
          </Stack>

          <Heading fontSize={'xl'} fontFamily={'body'}>
            {item.name}
          </Heading>
          {isConfigOpen ? (
            <Box mt={5}>
              <Formik
                initialValues={{
                  lockTime: 0,
                  twoFA: false,
                  autofill: true,
                  language: 'en'
                }}
                onSubmit={async (
                  values: SettingsValues,
                  { setSubmitting }: FormikHelpers<SettingsValues>
                ) => {
                  console.log(values)

                  setSubmitting(false)
                }}
              >
                {({
                  isSubmitting,
                  dirty,
                  handleSubmit,
                  errors,
                  touched,
                  values
                }) => (
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="flex-start">
                      <FormControl
                        isInvalid={!!errors.lockTime && touched.lockTime}
                      >
                        <FormLabel htmlFor="lockTime">
                          <Trans>Lock time</Trans>
                        </FormLabel>
                        <Field as={Select} id="lockTime" name="lockTime">
                          <option value={60}>1 minute</option>
                          <option value={120}>2 minutes</option>
                          <option value={3600}>1 hour</option>
                          <option value={14400}>4 hour</option>
                          <option value={28800}>8 hours</option>
                          <option value={86400}>1 day</option>
                          <option value={604800}>1 week</option>
                          <option value={2592000}>1 month</option>
                          <option value={0}>Never</option>
                        </Field>
                        <FormHelperText>
                          <Trans>
                            Automatically locks vault after chosen period of
                            time
                          </Trans>
                        </FormHelperText>
                      </FormControl>

                      {/* Not ideal, later refactor */}
                      <Field name="twoFA">
                        {({ field, form }: FieldProps) => {
                          const { onChange, ...rest } = field
                          return (
                            <FormControl
                              id="twoFA"
                              isInvalid={
                                !!form.errors['twoFA'] &&
                                !!form.touched['twoFA']
                              }
                            >
                              <Checkbox
                                {...rest}
                                id="twoFA"
                                onChange={onChange}
                                defaultChecked={values.twoFA}
                              >
                                2FA
                              </Checkbox>
                            </FormControl>
                          )
                        }}
                      </Field>

                      {/* Not ideal, later refactor */}
                      <Field name="autofill">
                        {({ field, form }: FieldProps) => {
                          const { onChange, ...rest } = field
                          return (
                            <FormControl
                              id="autofill"
                              isInvalid={
                                !!form.errors['autofill'] &&
                                !!form.touched['autofill']
                              }
                            >
                              <Checkbox
                                {...rest}
                                id="autofill"
                                onChange={onChange}
                                defaultChecked={values.autofill}
                              >
                                <Trans>Autofill</Trans>
                              </Checkbox>
                            </FormControl>
                          )
                        }}
                      </Field>

                      {/*  */}
                      <FormControl
                        isInvalid={!!errors.language && touched.language}
                      >
                        <FormLabel htmlFor="language">
                          <Trans>Language</Trans>
                        </FormLabel>
                        <Field as={Select} id="language" name="language">
                          <option value="en">English</option>
                          <option value="cz">Čeština</option>
                        </Field>
                      </FormControl>

                      <Button
                        mt={4}
                        colorScheme="teal"
                        disabled={isSubmitting || !dirty}
                        isLoading={isSubmitting}
                        type="submit"
                      >
                        <Trans>Save</Trans>
                      </Button>
                    </VStack>
                  </form>
                )}
              </Formik>
            </Box>
          ) : (
            <Stack mt={6} spacing={4}>
              <Box>
                <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                  Last IP Address
                </Text>
                <Text fontSize={'xl'}>{item.lastIpAddress}</Text>
              </Box>
              <Box>
                <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                  Geolocation
                </Text>
                <Text fontSize={'xl'}>{item.lastGeoLocation}</Text>
              </Box>
              <Box>
                <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                  Added
                </Text>
                <Tooltip
                  label={intlFormat(new Date(item.createdAt), {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                >
                  <Text fontSize={'xl'}>
                    {formatDistance(new Date(item.createdAt), new Date())} ago
                  </Text>
                </Tooltip>
              </Box>
            </Stack>
          )}
        </Box>
      </Flex>
    </>
  )
}

export default function Devices() {
  const {
    data,
    loading,
    refetch: deviceRefetch
  } = useMyDevicesQuery({
    // TODO figure out why this is called twice
    fetchPolicy: 'cache-first'
  })
  const [reject] = useRejectChallengeMutation()
  const [approve] = useApproveChallengeMutation()
  const [filterBy, setFilterBy] = useState('')
  const { data: devicesPageData, refetch } = useDevicesPageQuery({
    fetchPolicy: 'cache-first'
  })

  useEffect(() => {
    deviceRefetch()
  }, [])

  return (
    <Flex flexDirection="column">
      <Center>
        <Input
          w={['300px', '350px', '400px', '500px']}
          placeholder={t`Search for device`}
          m="auto"
          onChange={(ev) => {
            setFilterBy(ev.target.value)
          }}
        />
        <Center px={3}>
          <Stat ml="auto" whiteSpace={'nowrap'}>
            {data?.me?.devices.length} {t`devices`}
          </Stat>

          <RefreshDeviceButton refetch={deviceRefetch} />
        </Center>
      </Center>

      <VStack mt={3}>
        {devicesPageData?.me?.decryptionChallengesWaiting.map(
          (challengeToApprove) => {
            return (
              <Alert
                status="warning"
                display="grid"
                gridRowGap={1}
                maxW={500}
                key={challengeToApprove.id}
              >
                <Center>
                  New Device trying to login{' '}
                  {formatRelative(
                    new Date(challengeToApprove.createdAt),
                    new Date()
                  )}
                  : {challengeToApprove.id}
                </Center>

                <Grid
                  gridGap={1}
                  autoFlow="row"
                  templateColumns="repeat(auto-fit, 49%)"
                >
                  <Button
                    w="100%"
                    colorScheme="red"
                    // bgColor="red.100"
                    onClick={async () => {
                      await reject({
                        variables: {
                          id: challengeToApprove.id
                        }
                      })
                      refetch()
                    }}
                  >
                    <Trans>Reject</Trans>
                  </Button>
                  <Button
                    w="100%"
                    colorScheme="green"
                    onClick={async () => {
                      await approve({
                        variables: {
                          id: challengeToApprove.id
                        }
                      })
                      refetch()
                    }}
                  >
                    <Trans>Approve</Trans>
                  </Button>
                </Grid>
              </Alert>
            )
          }
        )}
      </VStack>
      <Center justifyContent={['flex-end', 'center', 'center']}>
        <Flex flexDirection="column">
          <Flex flexDirection="row" flexWrap="wrap" m="auto">
            {loading ? (
              <Center pt={5}>
                <Spinner size="lg" />
              </Center>
            ) : (
              data?.me?.devices
                ?.filter(({ name }) => {
                  return name.includes(filterBy)
                })
                .map((el, i) => {
                  return (
                    <DeviceListItem
                      {...el}
                      key={i}
                      masterId={devicesPageData?.me?.masterDeviceId as string}
                      refetch={deviceRefetch}
                    />
                  )
                })
            )}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  )
}
