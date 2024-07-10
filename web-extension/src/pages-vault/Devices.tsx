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
  useDisclosure,
  VStack,
  Stat,
  FormHelperText,
  HStack
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { NbSp } from '@src/components/util/NbSp'
import { Formik, FormikHelpers, Field, FieldProps } from 'formik'
import { useState } from 'react'
import { FiLogOut, FiSettings, FiStar } from 'react-icons/fi'
import { FaUserCheck } from 'react-icons/fa'
import { LiaUserAltSlashSolid } from 'react-icons/lia'
import {
  useChangeDeviceSettingsMutation,
  useChangeMasterDeviceMutation
} from '@shared/graphql/AccountDevices.codegen'
import { formatDistance, intlFormat } from 'date-fns'
import { DeviceDeleteAlert } from '@src/components/vault/DeviceDeleteAlert'
import { device } from '@src/background/ExtensionDevice'
import { RefreshDeviceButton } from '@src/components/vault/RefreshDeviceButton'
import { useNavigate } from 'react-router-dom'
import { DeviceQuery } from '@shared/generated/graphqlBaseTypes'
import { NewDevicesApprovalStack } from './NewDeviceApproval'
import {
  useDevicesListWithDataQuery,
  DevicesListWithDataDocument
} from './Devices.codegen'
import { vaultLockTimeoutOptions } from '@shared/constants'
import { useWindowSize } from 'usehooks-ts'
interface SettingsValues {
  lockTime: number
  syncTOTP: boolean
}

export const BadgeWithIcon = (props) => {
  return (
    <Badge display={'flex'} alignItems={'center'} {...props}>
      {props.children}
    </Badge>
  )
}

const DeviceListItem = ({
  deviceInfo,
  masterDeviceId,
  TOTPCode
}: {
  deviceInfo: Partial<DeviceQuery>
  masterDeviceId: string
  TOTPCode: string
}) => {
  const [changeMasterDeviceMutation] = useChangeMasterDeviceMutation()
  const [changedDeviceSettings] = useChangeDeviceSettingsMutation()
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [TOTPCode, setTOTPCode] = useState(deviceInfo.TOTPCode || '')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()

  const handleCopyTOTP = () => {
    navigator.clipboard.writeText(TOTPCode)
  }

  const isMasterDevice = deviceInfo.id === masterDeviceId
  const currentDevice = deviceInfo.id === device.id
  return (
    <>
      <Flex py={6} m={5}>
        <Box
          w="350px"
          bg={useColorModeValue('cyan.800', 'gray.800')}
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
            <HStack mb={2} spacing={3}>
              {deviceInfo.id === device.id && (
                <BadgeWithIcon height="min-content" colorScheme="yellow">
                  Current
                </BadgeWithIcon>
              )}
              {deviceInfo.id === masterDeviceId && (
                <BadgeWithIcon height="min-content" colorScheme="purple">
                  Master
                </BadgeWithIcon>
              )}
              {deviceInfo.logoutAt ? (
                <BadgeWithIcon height="min-content" colorScheme="red">
                  <LiaUserAltSlashSolid />
                  <Trans>Logged out</Trans>
                </BadgeWithIcon>
              ) : (
                <BadgeWithIcon height="min-content" colorScheme="green">
                  <FaUserCheck />
                  <Trans>Logged in</Trans>
                </BadgeWithIcon>
              )}
            </HStack>

            {(!isMasterDevice || currentDevice) && (
              <Menu>
                <MenuButton
                  as={IconButton}
                  size="xs"
                  variant="unstyled"
                  aria-label="Device actions"
                  fontSize="15px"
                  icon={<SettingsIcon color={'white'} />}
                />
                <MenuList>
                  {!currentDevice && isMasterDevice ? (
                    <MenuItem
                      onClick={() =>
                        changeMasterDeviceMutation({
                          variables: {
                            newMasterDeviceId: deviceInfo.id as string
                          }
                        })
                      }
                    >
                      <FiStar />
                      <NbSp />
                      <Trans>Set as master device</Trans>
                    </MenuItem>
                  ) : null}

                  <MenuItem onClick={() => onOpen()}>
                    <FiLogOut></FiLogOut>
                    <NbSp />
                    <Trans>Logout</Trans>
                  </MenuItem>
                  <DeviceDeleteAlert
                    id={deviceInfo.id as string}
                    isOpen={isOpen}
                    onClose={onClose}
                  />
                  <MenuItem
                    onClick={() => {
                      if (deviceInfo.id === device.id) {
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
            )}
          </Stack>

          <Heading fontSize={'xl'} fontFamily={'body'}>
            {deviceInfo.name}
          </Heading>
          {isConfigOpen ? (
            <Box mt={5}>
              <Formik
                initialValues={{
                  lockTime: deviceInfo.vaultLockTimeoutSeconds as number,
                  syncTOTP: deviceInfo.syncTOTP as boolean
                }}
                onSubmit={async (
                  values: SettingsValues,
                  { setSubmitting, resetForm }: FormikHelpers<SettingsValues>
                ) => {
                  console.log('Values', values)
                  changedDeviceSettings({
                    variables: {
                      id: deviceInfo.id as string,
                      syncTOTP: values.syncTOTP,
                      vaultLockTimeoutSeconds: parseInt(
                        values.lockTime.toString()
                      )
                    },
                    refetchQueries: [
                      {
                        query: DevicesListWithDataDocument,
                        variables: { id: deviceInfo.id as string }
                      }
                    ]
                  })
                  setSubmitting(false)
                  resetForm({ values })
                }}
              >
                {({
                  isSubmitting,
                  dirty,
                  handleSubmit,
                  errors,
                  touched,
                  values
                }) => {
                  return (
                    <form onSubmit={handleSubmit}>
                      <VStack spacing={4} align="flex-start">
                        <FormControl
                          isInvalid={!!errors.lockTime && touched.lockTime}
                        >
                          <FormLabel htmlFor="lockTime">
                            <Trans>Lock time</Trans>
                          </FormLabel>
                          <Field as={Select} id="lockTime" name="lockTime">
                            {vaultLockTimeoutOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Field>
                          <FormHelperText>
                            <Trans>
                              Automatically locks vault after chosen period of
                              time
                            </Trans>
                          </FormHelperText>
                        </FormControl>

                        {/* Not ideal, later refactor */}
                        <Field name="syncTOTP">
                          {({ field, form }: FieldProps) => {
                            const { onChange, ...rest } = field
                            return (
                              <FormControl
                                id="syncTOTP"
                                isInvalid={
                                  !!form.errors['syncTOTP'] &&
                                  !!form.touched['syncTOTP']
                                }
                              >
                                <Checkbox
                                  {...rest}
                                  id="syncTOTP"
                                  onChange={onChange}
                                  defaultChecked={values.syncTOTP}
                                >
                                  2FA
                                </Checkbox>
                              </FormControl>
                            )
                          }}
                        </Field>

                        <Button
                          mt={4}
                          colorScheme="teal"
                          isDisabled={isSubmitting || !dirty}
                          isLoading={isSubmitting}
                          type="submit"
                        >
                          <Trans>Save</Trans>
                        </Button>
                      </VStack>
                    </form>
                  )
                }}
              </Formik>
            </Box>
          ) : (
            <Stack mt={6} spacing={4}>
              <Box>
                <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                  <Trans>Last IP Address</Trans>
                </Text>
                <Text fontSize={'xl'}>{deviceInfo.lastIpAddress}</Text>
              </Box>
              <Box>
                <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                  <Trans>Geolocation</Trans>
                </Text>
                <Text fontSize={'md'}>{deviceInfo.lastGeoLocation}</Text>
              </Box>
              <HStack>
                <Box w="50%">
                  <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                    <Trans>Added</Trans>
                  </Text>
                  <Tooltip
                    label={intlFormat(new Date(deviceInfo.createdAt ?? ''), {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  >
                    <Text fontSize={'sm'}>
                      {formatDistance(
                        new Date(deviceInfo.createdAt ?? ''),
                        new Date()
                      )}{' '}
                      ago
                    </Text>
                  </Tooltip>
                </Box>
                <Box w="50%">
                  <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                    <Trans>Last sync</Trans>
                  </Text>
                  {deviceInfo.lastSyncAt && (
                    <Tooltip
                      label={intlFormat(new Date(deviceInfo.lastSyncAt ?? ''), {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    >
                      <Text fontSize={'sm'}>
                        {formatDistance(
                          new Date(deviceInfo.lastSyncAt ?? ''),
                          new Date()
                        )}{' '}
                        ago
                      </Text>
                    </Tooltip>
                  )}
                </Box>
              </HStack>
              <HStack>
                {TOTPCode && (
                  <Button onClick={handleCopyTOTP} size="sm" colorScheme="teal">
                    <Trans>Copy TOTP</Trans>
                  </Button>
                )}
              </HStack>
                  <Tooltip
                    label={intlFormat(new Date(deviceInfo.createdAt ?? ''), {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  >
                    <Text fontSize={'sm'}>
                      {formatDistance(
                        new Date(deviceInfo.createdAt ?? ''),
                        new Date()
                      )}{' '}
                      ago
                    </Text>
                  </Tooltip>
                </Box>

                <Box w="50%">
                  <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                    <Trans>Last sync</Trans>
                  </Text>
                  {deviceInfo.lastSyncAt && (
                    <Tooltip
                      label={intlFormat(new Date(deviceInfo.lastSyncAt ?? ''), {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    >
                      <Text fontSize={'sm'}>
                        {formatDistance(
                          new Date(deviceInfo.lastSyncAt ?? ''),
                          new Date()
                        )}{' '}
                        ago
                      </Text>
                    </Tooltip>
                  )}
                </Box>
              </HStack>
            </Stack>
          )}
        </Box>
      </Flex>
    </>
  )
}

export default function Devices() {
  const { data, loading } = useDevicesListWithDataQuery()

  const [filterBy, setFilterBy] = useState('')
  const { height } = useWindowSize()
  return (
    <Flex flexDirection="column">
      <Center
        justifyContent={'space-evenly'}
        w={'100%'}
        bgColor={'teal.900'}
        p={3}
      >
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

          <RefreshDeviceButton />
        </Center>
      </Center>

      <NewDevicesApprovalStack></NewDevicesApprovalStack>
      <Center justifyContent={['flex-end', 'center', 'center']}>
        <Flex flexDirection="column" maxH={`${height - 70}px`} overflow={'auto'}>
          <Flex flexDirection="row" flexWrap="wrap" justify={'center'}>
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
                      deviceInfo={el}
                      key={i}
                      masterDeviceId={data.me.masterDeviceId as string}
                      TOTPCode={el.TOTPCode}
                  )
                })
            )}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  )
}
