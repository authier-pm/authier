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
import {
  useChangeMasterDeviceMutation,
  useMyDevicesQuery
} from '@shared/graphql/AccountDevices.codegen'
import { formatDistance, intlFormat } from 'date-fns'
import { DeviceDeleteAlert } from '@src/components/vault/DeviceDeleteAlert'
import { device } from '@src/background/ExtensionDevice'
import { RefreshDeviceButton } from '@src/components/vault/RefreshDeviceButton'
import { useNavigate } from 'react-router-dom'
import { DeviceQuery } from '@shared/generated/graphqlBaseTypes'
import { NewDevicesApprovalStack } from './NewDeviceApproval'

interface SettingsValues {
  lockTime: number
  twoFA: boolean
}

const DeviceListItem = ({
  deviceInfo,
  masterDeviceId
}: {
  deviceInfo: Partial<DeviceQuery>
  masterDeviceId: string
}) => {
  const [changeMasterDeviceMutation] = useChangeMasterDeviceMutation()
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()

  return (
    <>
      <Flex py={6} m={5}>
        <Box
          w="350px"
          bg={useColorModeValue('white', 'gray.800')}
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
                <Badge height="min-content" colorScheme="yellow">
                  Current
                </Badge>
              )}
              {deviceInfo.id === masterDeviceId && (
                <Badge height="min-content" colorScheme="purple">
                  Master
                </Badge>
              )}
              {deviceInfo.logoutAt ? (
                <Badge height="min-content" colorScheme="red">
                  <Trans>Logged out</Trans>
                </Badge>
              ) : (
                <Badge height="min-content" colorScheme="green">
                  <Trans>Logged in</Trans>
                </Badge>
              )}
            </HStack>

            <Menu>
              <MenuButton
                as={IconButton}
                size="xs"
                variant="unstyled"
                aria-label="Favourite"
                fontSize="15px"
                icon={<SettingsIcon color={'white'} />}
              />
              <MenuList>
                {masterDeviceId !== deviceInfo.id ? (
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
                    <Trans>Set on master device</Trans>
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
          </Stack>

          <Heading fontSize={'xl'} fontFamily={'body'}>
            {deviceInfo.name}
          </Heading>
          {isConfigOpen ? (
            <Box mt={5}>
              <Formik
                initialValues={{
                  lockTime: deviceInfo.vaultLockTimeoutSeconds as number,
                  twoFA: deviceInfo.syncTOTP as boolean
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
                <Text fontSize={'xl'}>{deviceInfo.lastIpAddress}</Text>
              </Box>
              <Box>
                <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                  Geolocation
                </Text>
                <Text fontSize={'xl'}>{deviceInfo.lastGeoLocation}</Text>
              </Box>
              <Box>
                <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
                  Added
                </Text>
                <Tooltip
                  label={intlFormat(new Date(deviceInfo.createdAt ?? ''), {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                >
                  <Text fontSize={'xl'}>
                    {formatDistance(
                      new Date(deviceInfo.createdAt ?? ''),
                      new Date()
                    )}
                    ago
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
  const { data, loading, refetch: devicesRefetch } = useMyDevicesQuery()

  const [filterBy, setFilterBy] = useState('')

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

          <RefreshDeviceButton />
        </Center>
      </Center>

      <NewDevicesApprovalStack></NewDevicesApprovalStack>
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
                      deviceInfo={el}
                      key={i}
                      masterDeviceId={data.me.masterDeviceId as string}
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
