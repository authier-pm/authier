import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  Checkbox,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Spinner,
  Stack,
  Stat,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
  useColorModeValue
} from '@src/components/ui/legacy'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { NbSp } from '@src/components/util/NbSp'
import { Formik, FormikHelpers, Field, FieldProps } from 'formik'
import { useState } from 'react'
import { FiLogOut, FiSettings, FiStar } from 'react-icons/fi'
import { FaUserCheck } from 'react-icons/fa'
import { LiaUserAltSlashSolid } from 'react-icons/lia'
import {
  useChangeDeviceSettingsMutation,
  useChangeMasterDeviceMutation,
  useRenameDeviceMutation
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
import { SettingsIcon } from '@src/components/ui/icons'
interface SettingsValues {
  lockTime: number
  syncTOTP: boolean
}

interface RenameValues {
  name: string
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
  masterDeviceId
}: {
  deviceInfo: Partial<DeviceQuery>
  masterDeviceId: string
}) => {
  const [changeMasterDeviceMutation] = useChangeMasterDeviceMutation()
  const [changedDeviceSettings] = useChangeDeviceSettingsMutation()
  const [renameDeviceMutation] = useRenameDeviceMutation()
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()

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

          {isRenameOpen ? (
            <Formik
              initialValues={{
                name: deviceInfo.name ?? ''
              }}
              onSubmit={async (
                values: RenameValues,
                { setSubmitting, resetForm }: FormikHelpers<RenameValues>
              ) => {
                await renameDeviceMutation({
                  variables: {
                    id: deviceInfo.id as string,
                    name: values.name
                  },
                  refetchQueries: [
                    {
                      query: DevicesListWithDataDocument,
                      variables: { id: deviceInfo.id as string }
                    }
                  ]
                })
                setSubmitting(false)
                setIsRenameOpen(false)
                resetForm({ values })
              }}
            >
              {({ isSubmitting, handleSubmit }) => (
                <form onSubmit={handleSubmit}>
                  <HStack align="flex-end">
                    <FormControl>
                      <FormLabel mb={1}>
                        <Trans>Device name</Trans>
                      </FormLabel>
                      <Field
                        as={Input}
                        id="name"
                        name="name"
                        size="sm"
                        maxLength={128}
                      />
                    </FormControl>
                    <Button
                      colorScheme="teal"
                      size="sm"
                      type="submit"
                      isLoading={isSubmitting}
                    >
                      <Trans>Save</Trans>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsRenameOpen(false)}
                    >
                      <Trans>Cancel</Trans>
                    </Button>
                  </HStack>
                </form>
              )}
            </Formik>
          ) : (
            <HStack justify="space-between" align="center">
              <Heading fontSize={'xl'} fontFamily={'body'}>
                {deviceInfo.name}
              </Heading>
              {currentDevice && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setIsRenameOpen(true)}
                >
                  <Trans>Rename</Trans>
                </Button>
              )}
            </HStack>
          )}
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
                  {deviceInfo.lastSyncAt ? (
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
                  ) : (
                    <Text fontSize={'sm'}>
                      <Trans>Never synced</Trans>
                    </Text>
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

export function DevicesPage() {
  const { data, loading } = useDevicesListWithDataQuery()

  const [filterBy, setFilterBy] = useState('')
  const { height } = useWindowSize()

  const currentDevice = data?.me?.devices?.find((deviceInfo) => deviceInfo.id === device.id)
  const otherDevices =
    data?.me?.devices
      ?.filter((deviceInfo) => deviceInfo.id !== device.id)
      .filter(({ name }) => name.includes(filterBy)) ?? []

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
        <Flex
          flexDirection="column"
          maxH={`${height - 70}px`}
          overflow={'auto'}
        >
          <Flex flexDirection="column">
            {loading ? (
              <Center pt={5}>
                <Spinner size="lg" />
              </Center>
            ) : (
              <>
                {currentDevice ? (
                  <Box px={4} pt={4}>
                    <Text fontWeight={700} fontSize="sm" color="gray.400">
                      <Trans>This device</Trans>
                    </Text>
                    <DeviceListItem
                      deviceInfo={currentDevice}
                      masterDeviceId={data?.me?.masterDeviceId as string}
                    />
                  </Box>
                ) : null}

                <Box px={4} pt={2}>
                  <Text fontWeight={700} fontSize="sm" color="gray.400">
                    <Trans>Other devices</Trans>
                  </Text>
                </Box>
                <Flex flexDirection="row" flexWrap="wrap" justify={'center'}>
                  {otherDevices.map((el) => {
                    return (
                      <DeviceListItem
                        deviceInfo={el}
                        key={el.id}
                        masterDeviceId={data?.me?.masterDeviceId as string}
                      />
                    )
                  })}
                </Flex>
              </>
            )}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  )
}
