import { ArrowForwardIcon, SettingsIcon } from '@chakra-ui/icons'
import {
  Heading,
  Avatar,
  Box,
  Center,
  Text,
  Stack,
  Badge,
  useColorModeValue,
  Icon,
  IconButton,
  Flex,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Checkbox,
  Select,
  Button,
  Tooltip,
  Alert,
  VStack,
  Grid
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { NbSp } from '@src/components/util/NbSp'
import { useMyDevicesQuery } from '@src/pages/Devices.codegen'
import { Formik, FormikHelpers, Field } from 'formik'
import React, { useState } from 'react'
import { FiLogOut, FiSettings, FiTrash } from 'react-icons/fi'
import { IoIosPhonePortrait } from 'react-icons/io'
import {
  useApproveChallengeMutation,
  useDevicesPageQuery,
  useRejectChallengeMutation
} from './Devices.codegen'
import { formatDistance, formatRelative, intlFormat } from 'date-fns'

interface configValues {
  lockTime: number
  twoFA: boolean
}

const vaultLockTimeOptions = [
  { value: 0, label: 'On web close' },
  { value: 10000, label: '10 seconds' },
  { value: 288000000, label: '8 hours' },
  { value: 432000000, label: '12 hours' }
]

const DeviceListItem = (item: {
  id: string
  firstIpAddress: string
  lastIpAddress: string
  name: string
  lastGeoLocation: string
  createdAt: string
  logoutAt?: string | null | undefined
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const { data } = useDevicesPageQuery({ fetchPolicy: 'cache-first' })

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
          <Flex flexDirection={'row'} justifyContent={'space-between'}>
            <Icon as={IoIosPhonePortrait} boxSize={16} />
            <Stack
              direction={'row'}
              spacing={3}
              alignItems={'baseline'}
              lineHeight={'6'}
            >
              {item.id === data?.me?.masterDeviceId && (
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
              <Menu>
                <MenuButton
                  as={IconButton}
                  size="xs"
                  variant="unstyled"
                  aria-label="Favourite"
                  fontSize="15px"
                  icon={<SettingsIcon color="ButtonShadow" />}
                />
                <MenuList>
                  <MenuItem>
                    <FiLogOut></FiLogOut>
                    <NbSp />
                    <Trans>Deauthorize</Trans>
                  </MenuItem>
                  <MenuItem onClick={() => setIsConfigOpen(!isConfigOpen)}>
                    <FiSettings />
                    <NbSp />
                    <Trans>Config</Trans>
                  </MenuItem>
                </MenuList>
              </Menu>
            </Stack>
          </Flex>
          <Heading fontSize={'xl'} fontFamily={'body'}>
            {item.name}
          </Heading>
          {isConfigOpen ? (
            <Box mt={5}>
              <Formik
                initialValues={{
                  lockTime: 0,
                  twoFA: false
                }}
                onSubmit={async (
                  values: configValues,
                  { setSubmitting }: FormikHelpers<configValues>
                ) => {
                  console.log(values)
                  setSubmitting(false)
                }}
              >
                <Stack spacing={3}>
                  <Field name="lockTime">
                    {({ form }) => (
                      <FormControl
                        isInvalid={
                          form.errors.lockTime && form.touched.lockTime
                        }
                      >
                        <FormLabel htmlFor="lockTime">Safe lock time</FormLabel>
                        <Select
                          name="lockTime"
                          id="lockTime"
                          defaultValue={vaultLockTimeOptions[0].label}
                        >
                          {vaultLockTimeOptions.map((i) => (
                            <option key={i.value} value={i.value}>
                              {i.label}
                            </option>
                          ))}
                        </Select>
                        <FormErrorMessage>
                          {form.errors.lockTime}
                        </FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  <Field name="TwoFA">
                    {({ field, form }) => (
                      <FormControl
                        isInvalid={form.errors.name && form.touched.name}
                      >
                        <Checkbox id="TwoFA" {...field}>
                          2FA
                        </Checkbox>
                        <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                      </FormControl>
                    )}
                  </Field>
                  <Flex justifyContent={'flex-end'}>
                    <Button
                      type="submit"
                      size={'sm'}
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
                      rightIcon={<ArrowForwardIcon />}
                    >
                      Save
                    </Button>
                  </Flex>
                </Stack>
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
  const { data, loading } = useMyDevicesQuery({
    // TODO figure out why this is called twice
    fetchPolicy: 'cache-first'
  })
  const [reject] = useRejectChallengeMutation()
  const [approve] = useApproveChallengeMutation()
  const [filterBy, setFilterBy] = useState('')
  const { data: devicesPageData, refetch } = useDevicesPageQuery({
    fetchPolicy: 'cache-first'
  })

  return (
    <Flex flexDirection="column">
      <Input
        w={['300px', '350px', '400px', '500px']}
        placeholder={t`Search for device`}
        m="auto"
        onChange={(ev) => {
          setFilterBy(ev.target.value)
        }}
      />
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
                  return <DeviceListItem {...el} key={i} />
                })
            )}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  )
}
